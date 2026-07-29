from django.contrib import admin
from .models import User, Project, Task, Comment, Notification
from .models import ActivityLog


admin.site.register(User)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(Comment)
admin.site.register(Notification)
admin.site.register(ActivityLog)
