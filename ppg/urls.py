from django.urls import path
from .views import loadppg,ppg_analysis,load_base
from .sos import send_alert
urlpatterns=[
    path('ppg/',loadppg,name='ppg'),
    path('record/',ppg_analysis,name='record'),
    path('alert/',send_alert,name='alert'),
    path('',load_base,name='load_base')
]
