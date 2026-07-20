from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    FieldConfigurationViewSet,
    GuarantorViewSet,
    MemberAuditViewSet,
    MemberCategoryViewSet,
    MemberConfigurationViewSet,
    MemberViewSet,
    MemberWorkflowHistoryViewSet,
    NextOfKinViewSet,
    VehicleViewSet,
)

router = DefaultRouter()

router.register(
    r"member-categories",
    MemberCategoryViewSet,
)

router.register(
    r"members",
    MemberViewSet,
)

router.register(
    r"next-of-kin",
    NextOfKinViewSet,
)

router.register(
    r"vehicles",
    VehicleViewSet,
)

router.register(
    r"guarantors",
    GuarantorViewSet,
)

router.register(
    r"field-configurations",
    FieldConfigurationViewSet,
)

router.register(
    r"member-configurations",
    MemberConfigurationViewSet,
)

router.register(
    r"workflow-history",
    MemberWorkflowHistoryViewSet,
)

router.register(
    r"audit-trail",
    MemberAuditViewSet,
)

urlpatterns = [
    path("", include(router.urls)),
]