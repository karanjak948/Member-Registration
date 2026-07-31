from rest_framework import viewsets

from apps.members.permissions import (
    get_user_organization_membership,
)


class OrganizationScopedViewSet(
    viewsets.ModelViewSet
):
    """
    Base viewset for organization-owned resources.
    """

    organization_lookup = "organization"

    def get_membership(self):
        if not hasattr(
            self,
            "_organization_membership",
        ):
            self._organization_membership = (
                get_user_organization_membership(
                    self.request.user
                )
            )

        return self._organization_membership

    def get_organization(self):
        membership = self.get_membership()

        return (
            membership.organization
            if membership
            else None
        )