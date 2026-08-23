from copy import deepcopy
from datetime import date, datetime

from django.core.exceptions import ValidationError
from django.db import transaction
from django.forms.models import model_to_dict
from django.utils import timezone

from apps.members.models import (
    Member,
    MemberAudit,
    MemberCategory,
    MemberWorkflowHistory,
)


class MemberService:
    """
    Central business logic for Member operations.

    Members belong to organizations.

    created_by is retained strictly as creator attribution
    and must not be used as the business-data ownership
    boundary.
    """

    @staticmethod
    def _member_to_dict(member):
        """
        Convert a Member instance into a JSON-safe
        dictionary suitable for audit logging.
        """

        data = model_to_dict(member)

        # Organization ownership
        data["organization"] = (
            member.organization.id
            if member.organization
            else None
        )

        # Foreign Keys
        data["category"] = (
            member.category.id
            if member.category
            else None
        )

        data["created_by"] = (
            member.created_by.id
            if member.created_by
            else None
        )

        data["updated_by"] = (
            member.updated_by.id
            if member.updated_by
            else None
        )

        data["approved_by"] = (
            member.approved_by.id
            if member.approved_by
            else None
        )

        data["rejected_by"] = (
            member.rejected_by.id
            if member.rejected_by
            else None
        )

        data["activated_by"] = (
            member.activated_by.id
            if member.activated_by
            else None
        )

        # ImageField
        data["passport_photo"] = (
            member.passport_photo.name
            if member.passport_photo
            else None
        )

        # Datetime fields
        data["created_at"] = (
            member.created_at.isoformat()
            if member.created_at
            else None
        )

        data["updated_at"] = (
            member.updated_at.isoformat()
            if member.updated_at
            else None
        )

        data["approved_at"] = (
            member.approved_at.isoformat()
            if member.approved_at
            else None
        )

        data["rejected_at"] = (
            member.rejected_at.isoformat()
            if member.rejected_at
            else None
        )

        data["activated_at"] = (
            member.activated_at.isoformat()
            if member.activated_at
            else None
        )

        # Convert any remaining non-JSON-safe date objects.
        for key, value in data.items():
            if isinstance(
                value,
                (datetime, date),
            ):
                data[key] = value.isoformat()

        return data

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
    def create_member(
        serializer,
        user,
        organization,
    ):
        """
        Create an organization-owned member.

        organization and created_by are assigned exclusively
        by trusted backend context.

        The API client cannot select either field.
        """

        member = serializer.save(
            organization=organization,
            created_by=user,
        )

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.CREATE,
            user=user,
            old_data=None,
            new_data=MemberService._member_to_dict(
                member
            ),
        )

        return member

    @staticmethod
    @transaction.atomic
    def update_member(
        serializer,
        user,
    ):
        """
        Update a member.

        Organization ownership and created_by must remain
        unchanged during normal member updates.

        Automatically creates audit logs and workflow
        history where applicable.
        """

        member = serializer.instance

        old_data = deepcopy(
            MemberService._member_to_dict(
                member
            )
        )

        previous_stage = (
            member.registration_stage
        )

        member = serializer.save(
            updated_by=user,
        )

        new_data = (
            MemberService._member_to_dict(
                member
            )
        )

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.UPDATE,
            user=user,
            old_data=old_data,
            new_data=new_data,
        )

        if (
            previous_stage
            != member.registration_stage
        ):
            MemberService._create_workflow_history(
                member=member,
                previous_stage=previous_stage,
                current_stage=(
                    member.registration_stage
                ),
                user=user,
            )

        return member

    @staticmethod
    @transaction.atomic
    def delete_member(
        member,
        user,
    ):
        """
        Delete a member after recording an audit log.
        """

        old_data = (
            MemberService._member_to_dict(
                member
            )
        )

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
        Change a member workflow stage.

        Automatically creates audit and workflow records.
        """

        previous_stage = (
            member.registration_stage
        )

        if previous_stage == stage:
            return member

        old_data = (
            MemberService._member_to_dict(
                member
            )
        )

        member.registration_stage = stage

        member.updated_by = user

        member.save(
            update_fields=[
                "registration_stage",
                "updated_by",
            ]
        )

        new_data = (
            MemberService._member_to_dict(
                member
            )
        )

        if (
            stage
            == Member.RegistrationStage.APPROVED
        ):
            action = (
                MemberAudit.Action.APPROVE
            )

        elif (
            stage
            == Member.RegistrationStage.REJECTED
        ):
            action = (
                MemberAudit.Action.REJECT
            )

        else:
            action = (
                MemberAudit.Action.UPDATE
            )

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
    def _validate_completion(member):
        """
        Ensure the member has all mandatory information
        before completing registration.
        """

        required_fields = {
            "first_name":
                member.first_name,

            "national_id":
                member.national_id,

            "phone_number":
                member.phone_number,

            "category":
                member.category,
        }

        missing = [
            field
            for field, value
            in required_fields.items()
            if not value
        ]

        if missing:
            raise ValidationError(
                "Cannot complete registration. "
                "Missing fields: "
                f"{', '.join(missing)}"
            )

    @staticmethod
    @transaction.atomic
    def approve_member(
        member,
        user,
        remarks="",
    ):
        # Update registration stage
        member = MemberService.change_registration_stage(
            member=member,
            stage=Member.RegistrationStage.APPROVED,
            user=user,
            remarks=remarks,
        )

        # Set approval audit fields
        member.approved_by = user
        member.approved_at = timezone.now()
        member.updated_by = user

        member.save(
            update_fields=[
                "approved_by",
                "approved_at",
                "updated_by",
            ]
        )

        return member

    @staticmethod
    @transaction.atomic
    def reject_member(
        member,
        user,
        remarks="",
    ):
        # Update registration stage
        member = MemberService.change_registration_stage(
            member=member,
            stage=Member.RegistrationStage.REJECTED,
            user=user,
            remarks=remarks,
        )

        # Set rejection audit fields
        member.rejected_by = user
        member.rejected_at = timezone.now()
        member.updated_by = user

        member.save(
            update_fields=[
                "rejected_by",
                "rejected_at",
                "updated_by",
            ]
        )

        return member

    @staticmethod
    @transaction.atomic
    def activate_member(
        member,
        user,
    ):
        """
        Activate member.
        """

        if member.registration_stage not in (
            Member.RegistrationStage.APPROVED,
            Member.RegistrationStage.ACTIVE,
        ):
            raise ValidationError(
                "Member must be APPROVED before their account can be activated."
            )

        old_data = deepcopy(
            MemberService._member_to_dict(
                member
            )
        )

        member.status = (
            Member.MemberStatus.ACTIVE
        )

        # Set activation audit fields
        member.activated_by = user
        member.activated_at = timezone.now()
        member.updated_by = user

        member.save(
            update_fields=[
                "status",
                "activated_by",
                "activated_at",
                "updated_by",
            ]
        )

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.ACTIVATE,
            user=user,
            old_data=old_data,
            new_data=(
                MemberService
                ._member_to_dict(member)
            ),
        )

        return member

    @staticmethod
    @transaction.atomic
    def deactivate_member(
        member,
        user,
    ):
        """
        Deactivate member.
        """

        old_data = deepcopy(
            MemberService._member_to_dict(
                member
            )
        )

        member.status = (
            Member.MemberStatus.INACTIVE
        )

        member.updated_by = user

        member.save(
            update_fields=[
                "status",
                "updated_by",
            ]
        )

        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.DEACTIVATE,
            user=user,
            old_data=old_data,
            new_data=(
                MemberService
                ._member_to_dict(member)
            ),
        )

        return member

    @staticmethod
    @transaction.atomic
    def complete_registration(
        member,
        user,
    ):
        """
        Complete registration workflow.

        This method:
        - Validates the member has all required fields
        - Moves registration stage from APPROVED to ACTIVE
        - Sets member status to ACTIVE
        - Creates audit and workflow history records
        """

        if member.registration_stage != Member.RegistrationStage.APPROVED:
            raise ValidationError(
                "Member must be in APPROVED stage before registration can be completed."
            )

        MemberService._validate_completion(
            member
        )

        old_data = deepcopy(
            MemberService._member_to_dict(
                member
            )
        )

        # Update registration stage
        previous_stage = member.registration_stage
        member.registration_stage = Member.RegistrationStage.ACTIVE

        # Set member status to ACTIVE
        member.status = Member.MemberStatus.ACTIVE

        # Set activation audit fields
        member.activated_by = user
        member.activated_at = timezone.now()
        member.updated_by = user

        member.save(
            update_fields=[
                "registration_stage",
                "status",
                "activated_by",
                "activated_at",
                "updated_by",
            ]
        )

        new_data = (
            MemberService._member_to_dict(
                member
            )
        )

        # Create audit log
        MemberService._create_audit_log(
            member=member,
            action=MemberAudit.Action.COMPLETE_REGISTRATION,
            user=user,
            old_data=old_data,
            new_data=new_data,
        )

        # Create workflow history
        MemberService._create_workflow_history(
            member=member,
            previous_stage=previous_stage,
            current_stage=Member.RegistrationStage.ACTIVE,
            user=user,
            remarks=(
                "Member registration completed "
                "and activated."
            ),
        )

        return member