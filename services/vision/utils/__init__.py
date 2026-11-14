"""Geometry and computer-vision utility functions for Parkie parking detection.
"""
from .geometry import (
    is_point_in_poly,
    shrink_poly,
    car_in_slot,
    denormalize_slots,
)

__all__ = [
    "is_point_in_poly",
    "shrink_poly",
    "car_in_slot",
    "denormalize_slots",
]
