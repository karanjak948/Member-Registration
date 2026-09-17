from uuid import uuid4
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry
from apps.loans.serializers import (
    LedgerAccountSerializer,
    LedgerTransactionSerializer,
)
from apps.organizations.permissions import is_admin_or_owner_user


class LedgerAccountViewSet(viewsets.ModelViewSet):
    """
    Chart of Accounts management API.
    Restricts creation, updates, and deletion to Admins and Owners.
    """
    queryset = LedgerAccount.objects.all()
    serializer_class = LedgerAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["account_code", "account_name", "account_type"]
    ordering_fields = ["account_code", "account_type", "created_at"]
    ordering = ["account_code"]

    def create(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can create ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        org = getattr(self.request.user, "organization", None)
        if not org and hasattr(self.request.user, "memberships"):
            membership = self.request.user.memberships.first()
            if membership:
                org = membership.organization
        serializer.save(organization=org)

    def update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting accounts that have linked ledger entries.
        Allow deactivation instead. Admin/Owner only.
        """
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can delete ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        account = self.get_object()
        entry_count = account.entries.count()
        if entry_count > 0:
            return Response(
                {
                    "error": (
                        f"Cannot delete account '{account.account_code} - {account.account_name}' "
                        f"because it has {entry_count} linked transaction entries. "
                        "You can mark it Inactive instead to preserve audit integrity."
                    ),
                    "can_deactivate": True,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class LedgerTransactionViewSet(viewsets.ModelViewSet):
    """
    General ledger journal entries and manual income posting.
    Supports administrative deletion/voiding of transactions (Admin/Owner only).
    """
    queryset = LedgerTransaction.objects.all().prefetch_related("entries", "entries__account").select_related("loan", "loan__member")
    serializer_class = LedgerTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transaction_number", "reference_type", "reference_id", "loan__loan_number", "description"]
    ordering_fields = ["transaction_date", "created_at"]
    ordering = ["-transaction_date", "-created_at"]

    def get_queryset(self):
        qs = LedgerTransaction.objects.all().prefetch_related("entries", "entries__account").select_related("loan", "loan__member")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        account_code = self.request.query_params.get("account_code")
        ref_type = self.request.query_params.get("reference_type")

        if start_date:
            qs = qs.filter(transaction_date__gte=start_date)
        if end_date:
            qs = qs.filter(transaction_date__lte=end_date)
        if ref_type:
            qs = qs.filter(reference_type__iexact=ref_type)
        if account_code and account_code != "ALL":
            qs = qs.filter(entries__account__account_code=account_code).distinct()
        return qs

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Administrative void/delete of a journal transaction and its entries.
        Restricted to Admins and Owners.
        """
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can void or delete ledger transactions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        txn = self.get_object()
        txn.entries.all().delete()
        txn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="income-report")
    def income_report(self, request):
        """
        Period-based breakdown of all SACCO fee incomes, form fees, processing fees,
        security deposits, and interest incomes within an optional date window.
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        account_filter = request.query_params.get("account_code")

        entries_qs = (
            LedgerEntry.objects.filter(
                entry_type=LedgerEntry.EntryType.CREDIT,
                account__account_code__in=["4150", "4100", "2100", "4000", "4200"],
            )
            .select_related("transaction", "transaction__loan", "transaction__loan__member", "account")
            .order_by("-transaction__transaction_date", "-id")
        )

        if start_date:
            entries_qs = entries_qs.filter(transaction__transaction_date__gte=start_date)
        if end_date:
            entries_qs = entries_qs.filter(transaction__transaction_date__lte=end_date)
        if account_filter and account_filter != "ALL":
            entries_qs = entries_qs.filter(account__account_code=account_filter)

        total_form_fees = Decimal("0.00")
        total_processing_fees = Decimal("0.00")
        total_security_deposits = Decimal("0.00")
        total_interest_income = Decimal("0.00")
        total_penalties = Decimal("0.00")
        items = []

        for e in entries_qs:
            amt = e.amount
            code = e.account.account_code
            if code == "4150":
                total_form_fees += amt
                category = "Loan Form Fee"
            elif code == "4100":
                total_processing_fees += amt
                category = "Loan Processing Fee"
            elif code == "2100":
                total_security_deposits += amt
                category = "Security Deposit"
            elif code == "4000":
                total_interest_income += amt
                category = "Interest Income"
            elif code == "4200":
                total_penalties += amt
                category = "Penalty Income"
            else:
                category = e.account.account_name

            loan = e.transaction.loan
            member_name = "—"
            member_id = None
            if loan and loan.member:
                member_name = f"{loan.member.first_name} {loan.member.other_names}".strip()
                member_id = loan.member.id

            items.append({
                "id": e.id,
                "entry_id": e.id,
                "transaction_id": e.transaction.id,
                "transaction_number": e.transaction.transaction_number,
                "transaction_date": e.transaction.transaction_date.isoformat(),
                "reference_type": e.transaction.reference_type,
                "reference_id": e.transaction.reference_id,
                "loan_number": loan.loan_number if loan else None,
                "loan_id": loan.id if loan else None,
                "member_name": member_name,
                "member_id": member_id,
                "account_code": code,
                "account_name": e.account.account_name,
                "account_type": e.account.account_type,
                "entry_type": e.entry_type,
                "income_category": category,
                "amount": float(amt),
                "narration": e.narration or e.transaction.description,
            })

        grand_total = (
            total_form_fees
            + total_processing_fees
            + total_security_deposits
            + total_interest_income
            + total_penalties
        )

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "account_filter": account_filter or "ALL",
            "summary": {
                "total_form_fees": float(total_form_fees),
                "total_processing_fees": float(total_processing_fees),
                "total_security_deposits": float(total_security_deposits),
                "total_interest_income": float(total_interest_income),
                "total_penalties": float(total_penalties),
                "grand_total": float(grand_total),
                "record_count": len(items),
            },
            "records": items,
            "entries": items,
            "count": len(items),
        })

    @action(detail=False, methods=["post"], url_path="post-income")
    @transaction.atomic
    def post_income(self, request):
        """
        Post income transaction (fees, security deposits, interest, penalties)
        balanced against Cash/Bank (1010).
        """
        account_id = request.data.get("account_id")
        amount = request.data.get("amount")
        description = request.data.get("description", "").strip()
        reference_no = request.data.get("reference_no", "").strip()
        reference_type = request.data.get("reference_type", "INCOME").upper()
        transaction_date = request.data.get("transaction_date") or timezone.now().date()

        if not account_id or not amount:
            return Response(
                {"error": "account_id and amount are required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_account = LedgerAccount.objects.get(id=account_id)
        except LedgerAccount.DoesNotExist:
            return Response(
                {"error": f"Ledger account #{account_id} does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            parsed_amount = Decimal(str(amount))
            if parsed_amount <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {"error": "Amount must be a positive number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cash_account, _ = LedgerAccount.objects.get_or_create(
            account_code="1010",
            defaults={
                "account_name": "Cash and Bank Balances",
                "account_type": "asset",
                "is_active": True,
            },
        )

        txn_number = f"GL-INC-{uuid4().hex[:8].upper()}"
        journal_txn = LedgerTransaction.objects.create(
            transaction_number=txn_number,
            transaction_date=transaction_date,
            description=description or f"{target_account.account_name} payment received",
            reference_type=reference_type,
            reference_id=reference_no or txn_number,
        )

        # Debit Cash/Bank
        LedgerEntry.objects.create(
            transaction=journal_txn,
            account=cash_account,
            entry_type=LedgerEntry.EntryType.DEBIT,
            amount=parsed_amount,
            narration=f"Cash receipt for {target_account.account_name}",
        )

        # Credit Income / Liability Account
        LedgerEntry.objects.create(
            transaction=journal_txn,
            account=target_account,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=parsed_amount,
            narration=description or f"Receipt reference {reference_no}",
        )

        serializer = self.get_serializer(journal_txn)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="next-jv-no")
    def next_jv_no(self, request):
        """
        Generate the next sequential Journal Voucher Number (JVNO).
        """
        last_tx = (
            LedgerTransaction.objects.filter(jv_no__isnull=False)
            .exclude(jv_no="")
            .order_by("-id")
            .first()
        )
        if last_tx and last_tx.jv_no:
            digits = "".join(filter(str.isdigit, str(last_tx.jv_no)))
            if digits:
                return Response({"jv_no": str(int(digits) + 1)})
        return Response({"jv_no": "79400"})

    @action(detail=False, methods=["post"], url_path="post-general-journal")
    @transaction.atomic
    def post_general_journal(self, request):
        """
        Post balanced double-entry General Journal entries with two accounts
        (Money From & Money To) or multi-leg balanced lines.
        """
        data = request.data
        jv_no = str(data.get("jv_no") or "").strip()
        if not jv_no:
            last_tx = (
                LedgerTransaction.objects.filter(jv_no__isnull=False)
                .exclude(jv_no="")
                .order_by("-id")
                .first()
            )
            digits = "".join(filter(str.isdigit, str(last_tx.jv_no))) if last_tx and last_tx.jv_no else ""
            jv_no = str(int(digits) + 1) if digits else "79400"

        tx_date = data.get("transaction_date") or timezone.now().date()
        doc_no = str(data.get("document_no") or "").strip()
        description = str(data.get("description") or "General Journal Entry").strip()

        # Extract entry rows either from explicit Money From & Money To or entries array
        raw_entries = []
        if "money_from" in data and "money_to" in data:
            from_leg = data["money_from"]
            to_leg = data["money_to"]
            raw_entries.append({
                "account_id": from_leg.get("account_id") or from_leg.get("account_no"),
                "particular": from_leg.get("particular") or from_leg.get("narration") or description,
                "document_no": from_leg.get("document_no") or doc_no,
                "debit": from_leg.get("debit") or 0,
                "credit": from_leg.get("credit") or 0,
                "transaction_date": from_leg.get("transaction_date") or tx_date,
            })
            raw_entries.append({
                "account_id": to_leg.get("account_id") or to_leg.get("account_no"),
                "particular": to_leg.get("particular") or to_leg.get("narration") or description,
                "document_no": to_leg.get("document_no") or doc_no,
                "debit": to_leg.get("debit") or 0,
                "credit": to_leg.get("credit") or 0,
                "transaction_date": to_leg.get("transaction_date") or tx_date,
            })
        elif "entries" in data and isinstance(data["entries"], list):
            raw_entries = data["entries"]
        else:
            return Response(
                {"error": "Please provide Money From and Money To legs or an entries list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(raw_entries) < 2:
            return Response(
                {"error": "A balanced journal entry requires at least two account legs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        validated_items = []

        for idx, row in enumerate(raw_entries, start=1):
            acct_val = row.get("account_id") or row.get("account_no")
            if not acct_val:
                return Response(
                    {"error": f"Line {idx}: Account is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            account = None
            if str(acct_val).isdigit():
                account = LedgerAccount.objects.filter(id=int(acct_val)).first()
            if not account:
                account = LedgerAccount.objects.filter(account_code=str(acct_val)).first()
            if not account:
                account = LedgerAccount.objects.filter(account_name__iexact=str(acct_val)).first()
            if not account:
                return Response(
                    {"error": f"Line {idx}: Ledger Account '{acct_val}' not found in Chart of Accounts."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                d_amt = Decimal(str(row.get("debit") or 0).replace(",", "").strip() or "0")
                c_amt = Decimal(str(row.get("credit") or 0).replace(",", "").strip() or "0")
            except Exception:
                return Response(
                    {"error": f"Line {idx}: Invalid numeric debit or credit amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if d_amt <= 0 and c_amt <= 0:
                return Response(
                    {"error": f"Line {idx}: Must specify either a Debit or Credit amount greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if d_amt > 0 and c_amt > 0:
                return Response(
                    {"error": f"Line {idx}: A single leg cannot have both Debit and Credit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            entry_type = (
                LedgerEntry.EntryType.DEBIT if d_amt > 0 else LedgerEntry.EntryType.CREDIT
            )
            amount = d_amt if d_amt > 0 else c_amt

            total_debit += d_amt
            total_credit += c_amt

            validated_items.append({
                "account": account,
                "entry_type": entry_type,
                "amount": amount,
                "narration": str(row.get("particular") or row.get("narration") or description).strip(),
                "document_no": str(row.get("document_no") or doc_no).strip(),
                "jv_no": jv_no,
            })

        if total_debit != total_credit:
            return Response(
                {
                    "error": (
                        f"Unbalanced journal entry! Total Debits (KES {total_debit:,.2f}) "
                        f"must equal Total Credits (KES {total_credit:,.2f}). Difference: KES {abs(total_debit - total_credit):,.2f}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        txn_number = f"JV-{jv_no}"
        # Ensure unique transaction number
        if LedgerTransaction.objects.filter(transaction_number=txn_number).exists():
            txn_number = f"JV-{jv_no}-{uuid4().hex[:4].upper()}"

        journal_txn = LedgerTransaction.objects.create(
            transaction_number=txn_number,
            jv_no=jv_no,
            transaction_date=tx_date,
            description=description,
            reference_type="GENERAL_JOURNAL",
            reference_id=doc_no or jv_no,
        )

        for item in validated_items:
            LedgerEntry.objects.create(
                transaction=journal_txn,
                account=item["account"],
                entry_type=item["entry_type"],
                amount=item["amount"],
                narration=item["narration"],
                document_no=item["document_no"],
                jv_no=jv_no,
            )

        serializer = self.get_serializer(journal_txn)
        return Response(
            {
                "success": True,
                "message": f"Journal entry {jv_no} posted successfully.",
                "transaction": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="post-brought-forward")
    @transaction.atomic
    def post_brought_forward(self, request):
        """
        Post opening balance / Brought Forward (Account BF) matching Peter's Screenshot 2.
        Balances against Retained Earnings / Opening Balance Equity (3000).
        """
        data = request.data
        acct_val = data.get("account_no") or data.get("account_id")
        particular = str(data.get("particular") or "Balance Brought Forward").strip()
        doc_no = str(data.get("document_no") or "").strip()
        tx_date = data.get("transaction_date") or timezone.now().date()
        jv_no = str(data.get("jv_no") or "").strip()

        if not jv_no:
            last_tx = (
                LedgerTransaction.objects.filter(jv_no__isnull=False)
                .exclude(jv_no="")
                .order_by("-id")
                .first()
            )
            digits = "".join(filter(str.isdigit, str(last_tx.jv_no))) if last_tx and last_tx.jv_no else ""
            jv_no = str(int(digits) + 1) if digits else "79400"

        if not acct_val:
            return Response(
                {"error": "Account No is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_account = None
        if str(acct_val).isdigit():
            target_account = LedgerAccount.objects.filter(id=int(acct_val)).first()
        if not target_account:
            target_account = LedgerAccount.objects.filter(account_code=str(acct_val)).first()
        if not target_account:
            target_account = LedgerAccount.objects.filter(account_name__iexact=str(acct_val)).first()
        if not target_account:
            return Response(
                {"error": f"Account '{acct_val}' not found in Chart of Accounts."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            d_amt = Decimal(str(data.get("debit") or 0).replace(",", "").strip() or "0")
            c_amt = Decimal(str(data.get("credit") or 0).replace(",", "").strip() or "0")
        except Exception:
            return Response(
                {"error": "Invalid numeric debit or credit amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if d_amt <= 0 and c_amt <= 0:
            return Response(
                {"error": "Please specify either Debit or Credit opening balance amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Opening balance equity account (3000)
        org = getattr(target_account, "organization", None)
        equity_account, _ = LedgerAccount.objects.get_or_create(
            account_code="3000",
            defaults={
                "account_name": "Opening Balance Equity / Retained Earnings",
                "account_type": "equity",
                "is_active": True,
                "organization": org,
            },
        )

        txn_number = f"BF-{jv_no}"
        if LedgerTransaction.objects.filter(transaction_number=txn_number).exists():
            txn_number = f"BF-{jv_no}-{uuid4().hex[:4].upper()}"

        bf_txn = LedgerTransaction.objects.create(
            transaction_number=txn_number,
            jv_no=jv_no,
            transaction_date=tx_date,
            description=f"Brought Forward (Opening Balance) for {target_account.account_name}",
            reference_type="BROUGHT_FORWARD",
            reference_id=doc_no or jv_no,
        )

        if d_amt > 0:
            # Debit Target Account, Credit Equity Account
            LedgerEntry.objects.create(
                transaction=bf_txn,
                account=target_account,
                entry_type=LedgerEntry.EntryType.DEBIT,
                amount=d_amt,
                narration=particular,
                document_no=doc_no,
                jv_no=jv_no,
            )
            LedgerEntry.objects.create(
                transaction=bf_txn,
                account=equity_account,
                entry_type=LedgerEntry.EntryType.CREDIT,
                amount=d_amt,
                narration=f"Opening balance offset for {target_account.account_name}",
                document_no=doc_no,
                jv_no=jv_no,
            )
        else:
            # Credit Target Account, Debit Equity Account
            LedgerEntry.objects.create(
                transaction=bf_txn,
                account=target_account,
                entry_type=LedgerEntry.EntryType.CREDIT,
                amount=c_amt,
                narration=particular,
                document_no=doc_no,
                jv_no=jv_no,
            )
            LedgerEntry.objects.create(
                transaction=bf_txn,
                account=equity_account,
                entry_type=LedgerEntry.EntryType.DEBIT,
                amount=c_amt,
                narration=f"Opening balance offset for {target_account.account_name}",
                document_no=doc_no,
                jv_no=jv_no,
            )

        serializer = self.get_serializer(bf_txn)
        return Response(
            {
                "success": True,
                "message": f"Brought forward balance for {target_account.account_name} saved successfully.",
                "transaction": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="journal-entries-list")
    def journal_entries_list(self, request):
        """
        List journal transactions matching Screenshot 3:
        Columns: #, Account No, Jv No, Particular, Document No, Transaction Date, Debit, Credit.
        Filtered by Account No, Date From, Date To.
        """
        account_val = request.query_params.get("account_no") or request.query_params.get("account_id")
        date_from = request.query_params.get("date_from") or request.query_params.get("start_date")
        date_to = request.query_params.get("date_to") or request.query_params.get("end_date")
        search = request.query_params.get("search")

        entries_qs = (
            LedgerEntry.objects.select_related("account", "transaction")
            .order_by("-transaction__transaction_date", "-id")
        )

        if account_val and str(account_val) != "ALL":
            s_val = str(account_val).strip()
            if s_val.isdigit():
                entries_qs = entries_qs.filter(
                    Q(account_id=int(s_val))
                    | Q(account__account_code=s_val)
                    | Q(account__account_name__icontains=s_val)
                )
            else:
                entries_qs = entries_qs.filter(
                    Q(account__account_code=s_val)
                    | Q(account__account_name__icontains=s_val)
                )


        if date_from:
            entries_qs = entries_qs.filter(transaction__transaction_date__gte=date_from)
        if date_to:
            entries_qs = entries_qs.filter(transaction__transaction_date__lte=date_to)

        if search:
            s = str(search).strip()
            entries_qs = entries_qs.filter(
                Q(transaction__jv_no__icontains=s)
                | Q(jv_no__icontains=s)
                | Q(document_no__icontains=s)
                | Q(transaction__reference_id__icontains=s)
                | Q(narration__icontains=s)
                | Q(account__account_name__icontains=s)
                | Q(account__account_code__icontains=s)
            )

        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        rows = []

        for idx, entry in enumerate(entries_qs, start=1):
            is_debit = entry.entry_type == LedgerEntry.EntryType.DEBIT
            d_str = f"{entry.amount:.2f}" if is_debit else "0.00"
            c_str = f"{entry.amount:.2f}" if not is_debit else "0.00"

            if is_debit:
                total_debit += entry.amount
            else:
                total_credit += entry.amount

            jv_display = entry.jv_no or entry.transaction.jv_no or (
                entry.transaction.transaction_number.replace("JV-", "").replace("BF-", "")
                if ("JV-" in entry.transaction.transaction_number or "BF-" in entry.transaction.transaction_number)
                else entry.transaction.transaction_number
            )

            doc_display = entry.document_no or entry.transaction.reference_id or "—"

            rows.append({
                "id": entry.id,
                "index": idx,
                "transaction_id": entry.transaction_id,
                "account_id": entry.account_id,
                "account_no": f"{entry.account.account_code} - {entry.account.account_name}",
                "account_code": entry.account.account_code,
                "account_name": entry.account.account_name,
                "jv_no": jv_display,
                "particular": entry.narration or entry.transaction.description,
                "document_no": doc_display,
                "transaction_date": entry.transaction.transaction_date.strftime("%Y-%m-%d"),
                "debit": d_str,
                "credit": c_str,
                "entry_type": entry.entry_type,
                "amount": float(entry.amount),
            })

        return Response({
            "count": len(rows),
            "total_debit": float(total_debit),
            "total_credit": float(total_credit),
            "entries": rows,
        })

