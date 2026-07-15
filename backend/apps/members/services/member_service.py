from copy import deepcopy

from django.core.exceptions import ValidationError
from django.db import transaction
from django.forms.models import model_to_dict

from apps.members.models import (
    Member,
    MemberAudit,
    MemberCategory,
    MemberWorkflowHistory,
)


class MemberService:
    """
    Central business logic for Member operations.
    """

    @staticmethod
    def _create_audit_log(
        *,
        member,
        action,
        user,
        old_data=None,
        new_data=None,
    ):
        """
        Create an audit trail record.
        """

        MemberAudit.objects.create(
            member=member,
            action=action,
            changed_by=user,
            old_data=old_data,
            new_data=new_data,
        )

    @staticmethod
    def _create_workflow_history(
        *,
        member,
        previous_stage,
        current_stage,
        user,
        remarks="",
    ):
        """
        Record workflow stage transitions.
        """

        MemberWorkflowHistory.objects.create(
            member=member,
            previous_stage=previous_stage,
            current_stage=current_stage,
            changed_by=user,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def create_member(serializer, user):
        """
        Create member and audit the operation.
        """

        member = serializer.save(created_by=user)

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.CREATE,
            user=user,
            old_data=None,
            new_data=model_to_dict(member),
        )

        return member

    @staticmethod
    @transaction.atomic
    def update_member(serializer, user):
        """
        Update member.
        Automatically creates audit logs and workflow history.
        """

        member = serializer.instance

        old_data = deepcopy(model_to_dict(member))
        previous_stage = member.registration_stage

        member = serializer.save()

        new_data = model_to_dict(member)

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.UPDATE,
            user=user,
            old_data=old_data,
            new_data=new_data,
        )

        if previous_stage != member.registration_stage:

            MemberService._create_workflow_history(
                member=member,
                previous_stage=previous_stage,
                current_stage=member.registration_stage,
                user=user,
            )

        return member

    @staticmethod
    @transaction.atomic
    def delete_member(member, user):
        """
        Delete member after recording an audit log.
        """

        old_data = model_to_dict(member)

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.DELETE,
            user=user,
            old_data=old_data,
            new_data=None,
        )

        member.delete()

    @staticmethod
    @transaction.atomic
    def change_registration_stage(
        member,
        stage,
        user,
        remarks="",
    ):
        """
        Change member workflow stage.
        Automatically creates audit and workflow records.
        """

        previous_stage = member.registration_stage

        if previous_stage == stage:
            return member

        old_data = model_to_dict(member)

        member.registration_stage = stage
        member.save(update_fields=["registration_stage"])

        new_data = model_to_dict(member)

        if stage == Member.RegistrationStage.APPROVED:
            action = MemberAudit.Action.APPROVE

        elif stage == Member.RegistrationStage.REJECTED:
            action = MemberAudit.Action.REJECT

        else:
            action = MemberAudit.Action.UPDATE

        MemberService._create_audit_log(
            member=member,
            action=action,
            user=user,
            old_data=old_data,
            new_data=new_data,
        )

        MemberService._create_workflow_history(
            member=member,
            previous_stage=previous_stage,
            current_stage=stage,
            user=user,
            remarks=remarks,
        )

        return member
    
    @staticmethod
    def _validate_conversion(member):
        """
        Ensure the member has all mandatory information
        before conversion.
        """

        required_fields = {
            "first_name": member.first_name,
            "other_names": member.other_names,
            "national_id": member.national_id,
            "phone_number": member.phone_number,
            "category": member.category,
        }

        missing = [
            field
            for field, value in required_fields.items()
            if not value
        ]

        if missing:
            raise ValidationError(
                f"Cannot convert member. Missing fields: {', '.join(missing)}"
            )

    @staticmethod
    @transaction.atomic
    def approve_member(member, user, remarks=""):
        return MemberService.change_registration_stage(
            member=member,
            stage=Member.RegistrationStage.APPROVED,
            user=user,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def reject_member(member, user, remarks=""):
        return MemberService.change_registration_stage(
            member=member,
            stage=Member.RegistrationStage.REJECTED,
            user=user,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def activate_member(member, user):
        """
        Activate member.
        """

        old_data = deepcopy(model_to_dict(member))

        member.status = Member.MemberStatus.ACTIVE
        member.save(update_fields=["status"])

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.UPDATE,
            user=user,
            old_data=old_data,
            new_data=model_to_dict(member),
        )

        return member

    @staticmethod
    @transaction.atomic
    def deactivate_member(member, user):
        """
        Deactivate member.
        """

        old_data = deepcopy(model_to_dict(member))

        member.status = Member.MemberStatus.INACTIVE
        member.save(update_fields=["status"])

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.UPDATE,
            user=user,
            old_data=old_data,
            new_data=model_to_dict(member),
        )

        return member

    @staticmethod
    @transaction.atomic
    def convert_member(member, user):
        """
        Convert an Other Member into a Normal Member.
        """

        MemberService._validate_conversion(member)

        normal_category = MemberCategory.objects.get(
            code="NORMAL"
        )

        old_data = deepcopy(model_to_dict(member))

        member.category = normal_category
        member.save(update_fields=["category"])

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.CONVERT,
            user=user,
            old_data=old_data,
            new_data=model_to_dict(member),
        )

        return member