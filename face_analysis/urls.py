from django.urls import path
from . import views

urlpatterns = [
    # Endpoint that processes the captured image:
    path('capture_image/', views.capture_image, name='capture_image'),
    # Endpoint that receives JSON POST and renders the result page:
    path('result2/', views.result2, name='result2'),
]
