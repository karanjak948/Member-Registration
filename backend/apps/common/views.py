from rest_framework import viewsets

from apps.organizations.models import OrganizationUser


class OrganizationScopedViewSet(viewsets.ModelViewSet):
    """
    Base viewset for organization-scoped resources.

    Provides helper methods for retrieving the current
    authenticated user's active organization membership.
    """

    def get_membership(self):
        if not hasattr(self, "_organization_membership"):
            self._organization_membership = (
                OrganizationUser.objects
                .select_related("organization")
                .filter(
                    user=self.request.user,
                    is_active=True,
                )
                .first()
            )

        return self._organization_membership

    def get_organization(self):
        membership = self.get_membership()

        if membership:
            return membership.organization

        if hasattr(self.request.user, "organization") and self.request.user.organization:
            return self.request.user.organization

        from apps.organizations.models import Organization
        return Organization.objects.first()