from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "admin"
        )


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "manager"
        )


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "employee"
        )


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["admin", "manager"]
        )

class IsTaskOwnerOrManager(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "manager"]:
            return True

        return obj.assigned_to == request.user