from typing import List
from fastapi import APIRouter
from app.models.enums import ProductCategory, QuantityUnit
from app.schemas.produce import CropReferenceItem

router = APIRouter(prefix="/reference", tags=["Reference Data"])

CROP_CATALOG: List[CropReferenceItem] = [
    CropReferenceItem(
        name="Tomato",
        category=ProductCategory.VEGETABLE,
        varieties=["Hybrid", "Desi", "Cherry", "Roma"],
        standard_unit=QuantityUnit.KG,
    ),
    CropReferenceItem(
        name="Onion",
        category=ProductCategory.VEGETABLE,
        varieties=["Nashik Red", "White", "Shallot", "Garlic Onion"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Potato",
        category=ProductCategory.VEGETABLE,
        varieties=["Kufri Jyoti", "Kufri Chandramukhi", "Lauvkar", "Chipsona"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Green Chilli",
        category=ProductCategory.VEGETABLE,
        varieties=["G-4", "Jwala", "Bullet", "Bhavnagri"],
        standard_unit=QuantityUnit.KG,
    ),
    CropReferenceItem(
        name="Basmati Rice",
        category=ProductCategory.GRAIN,
        varieties=["Pusa 1121", "Traditional Basmati", "Sugandh", "Sharbati"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Non-Basmati Rice",
        category=ProductCategory.GRAIN,
        varieties=["Sona Masoori", "IR-64", "Swarna", "Kolam", "Ponni"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Wheat",
        category=ProductCategory.GRAIN,
        varieties=["Sharbati", "Lokwan", "Kalyan Sona", "HD-2967"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Maize / Corn",
        category=ProductCategory.GRAIN,
        varieties=["Yellow Hybrid", "Sweet Corn", "White Maize"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Red Gram / Toor Dal",
        category=ProductCategory.PULSE,
        varieties=["Maruti", "Asha", "BDN-2", "Desi"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Bengal Gram / Chana",
        category=ProductCategory.PULSE,
        varieties=["Kabuli", "Desi Brown", "Annigeri", "JG-11"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Green Gram / Moong",
        category=ProductCategory.PULSE,
        varieties=["Shiny Green", "Pusa Baisakhi", "K-851"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Soybean",
        category=ProductCategory.OILSEED,
        varieties=["JS-335", "JS-9560", "NRC-37"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Groundnut / Peanut",
        category=ProductCategory.OILSEED,
        varieties=["TMV-2", "TAG-24", "Bold", "Java"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Mustard Seed",
        category=ProductCategory.OILSEED,
        varieties=["Pusa Bold", "Varuna", "Kranti"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Mango",
        category=ProductCategory.FRUIT,
        varieties=["Alphonso", "Banganapalli", "Kesar", "Dasheri", "Totapuri"],
        standard_unit=QuantityUnit.KG,
    ),
    CropReferenceItem(
        name="Banana",
        category=ProductCategory.FRUIT,
        varieties=["Grand Naine (G9)", "Robusta", "Yelakki", "Red Banana"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Apple",
        category=ProductCategory.FRUIT,
        varieties=["Royal Delicious", "Golden Delicious", "Kashmir Red"],
        standard_unit=QuantityUnit.KG,
    ),
    CropReferenceItem(
        name="Turmeric",
        category=ProductCategory.SPICE,
        varieties=["Salem", "Nizamabad", "Erode", "Lakadong"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Dry Red Chilli",
        category=ProductCategory.SPICE,
        varieties=["Byadgi", "Guntur Sannam", "Teja", "Kashmiri"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
    CropReferenceItem(
        name="Cotton",
        category=ProductCategory.OTHER,
        varieties=["Bt Cotton", "DCH-32", "MCU-5"],
        standard_unit=QuantityUnit.QUINTAL,
    ),
]


@router.get(
    "/crops",
    response_model=List[CropReferenceItem],
    summary="List Standard Crops Catalog",
    description="Returns pre-defined agricultural crops with categories, common varieties, and standard units.",
)
def get_crop_catalog() -> List[CropReferenceItem]:
    return CROP_CATALOG
