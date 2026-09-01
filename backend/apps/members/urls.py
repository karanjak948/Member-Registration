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
    SendSMSAPIView,
)



router = DefaultRouter()

router.register(
    r"member-categories",
    MemberCategoryViewSet,
)

router.register(
    r"members",
    MemberViewSet,
    basename="member",
)

router.register(
    r"next-of-kin",
    NextOfKinViewSet,
    basename="next-of-kin",
)

router.register(
    r"vehicles",
    VehicleViewSet,
    basename="vehicle",
)

router.register(
    r"guarantors",
    GuarantorViewSet,
    basename="guarantor",
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
    basename="workflow-history",
)

router.register(
    r"audit-trail",
    MemberAuditViewSet,
    basename="audit-trail",
)


urlpatterns = [
    path("sms/send", SendSMSAPIView.as_view(), name="send-sms-no-slash"),
    path("sms/send/", SendSMSAPIView.as_view(), name="send-sms"),
    path("", include(router.urls)),
]