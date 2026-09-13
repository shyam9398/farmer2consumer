"""
Automated demo data seeder for Mandi Direct.
Populates rich, realistic data for Farmers, Buyers, Small Consumers, Logistics, and Admins.
"""
import uuid
import datetime
from sqlalchemy.orm import Session
from app.models.enums import (
    UserRole,
    UserStatus,
    ProductCategory,
    ProduceStatus,
    QuantityUnit,
    PriceUnit,
    QualityGrade,
    OrderStatus,
    PaymentStatus,
    EarningStatus,
)
from app.models.profile import Profile
from app.models.farmer import FarmerProfile, Farm
from app.models.produce import ProduceListing
from app.models.vehicle import Vehicle
from app.models.address import BuyerAddress
from app.models.order import Order, OrderItem
from app.models.earnings import FarmerEarning
from app.core.logging import get_logger

logger = get_logger("seed_demo_data")


def seed_demo_data(db: Session):
    """Seed comprehensive demo data for all 5 roles."""
    logger.info("Checking and seeding demo datasets for Farmers, Buyers, and Logistics...")

    # 1. Seed All 5 Demo Profiles
    demo_users_data = [
        ("auth-farmer-uuid", "farmer@mandidirect.in", "Ramesh Patel (Farmer)", UserRole.FARMER.value),
        ("auth-buyer-uuid", "buyer@mandidirect.in", "Ananya Wholesale Procurements", UserRole.BUYER.value),
        ("auth-logistics-uuid", "logistics@mandidirect.in", "Kiran FastTrack Freight Fleet", UserRole.LOGISTICS.value),
        ("auth-consumer-uuid", "consumer@mandidirect.in", "Pooja Reddy Household", UserRole.CONSUMER.value),
        ("auth-admin-uuid", "admin@mandidirect.in", "Mandi Direct Compliance Admin", UserRole.ADMIN.value),
    ]

    profile_map = {}
    for auth_id, email, name, role in demo_users_data:
        p = db.query(Profile).filter((Profile.auth_user_id == auth_id) | (Profile.email == email)).first()
        if not p:
            p = Profile(
                auth_user_id=auth_id,
                email=email,
                full_name=name,
                phone="+919876543210",
                role=role,
                status=UserStatus.ACTIVE.value,
            )
            db.add(p)
            db.commit()
            db.refresh(p)
        else:
            # Update role if needed
            if p.role != role:
                p.role = role
                db.commit()
        profile_map[role] = p

    farmer_profile_obj = profile_map[UserRole.FARMER.value]
    buyer_profile_obj = profile_map[UserRole.BUYER.value]
    consumer_profile_obj = profile_map[UserRole.CONSUMER.value]
    logistics_profile_obj = profile_map[UserRole.LOGISTICS.value]

    # 2. Ensure Farmer Profile and Farm
    fp = db.query(FarmerProfile).filter_by(profile_id=farmer_profile_obj.id).first()
    if not fp:
        fp = FarmerProfile(
            profile_id=farmer_profile_obj.id,
            address_line="Survey No. 42, Main Village Road",
            village="Shamshabad",
            mandal="Shamshabad",
            district="Ranga Reddy",
            state="Telangana",
            pincode="501218",
        )
        db.add(fp)
        db.commit()
        db.refresh(fp)

    farm = db.query(Farm).filter_by(farmer_profile_id=fp.id).first()
    if not farm:
        farm = Farm(
            farmer_profile_id=fp.id,
            farm_name="Green Horizon Organic Farm",
            total_area=6.5,
            area_unit="ACRE",
            ownership_type="OWNED",
            primary_crops=["Tomato", "Potato", "Chilli", "Rice", "Mango"],
            village=fp.village,
            mandal=fp.mandal,
            district=fp.district,
            state=fp.state,
            pincode=fp.pincode,
            latitude=17.2403,
            longitude=78.4294,
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

    # 3. Seed Realistic Produce Listings (Produce Market Data)
    existing_listings_count = db.query(ProduceListing).filter_by(farmer_profile_id=fp.id).count()
    created_listings = []
    if existing_listings_count == 0:
        today = datetime.date.today()
        listings_catalog = [
            {
                "name": "Hybrid Red Tomatoes",
                "category": ProductCategory.VEGETABLE.value,
                "variety": "Shimla Hybrid F1",
                "description": "Farm-fresh ripe tomatoes harvested this morning. Firm texture, vibrant deep red color, ideal for wholesale and daily culinary use.",
                "total_qty": 1500,
                "available_qty": 1300,
                "price": 24.00,
                "shelf_life": 7,
            },
            {
                "name": "Kufri Jyoti Potatoes",
                "category": ProductCategory.VEGETABLE.value,
                "variety": "Kufri Jyoti",
                "description": "Premium uniform-sized potatoes grown in sandy loam soil. Excellent storage stability and high culinary quality.",
                "total_qty": 3000,
                "available_qty": 3000,
                "price": 18.00,
                "shelf_life": 45,
            },
            {
                "name": "Guntur Sannam Red Chillies",
                "category": ProductCategory.SPICE.value,
                "variety": "S17 Sannam",
                "description": "Authentic sun-dried pungent red chillies directly from the farm gates. High capsaicin content and natural dark crimson color.",
                "total_qty": 800,
                "available_qty": 750,
                "price": 185.00,
                "shelf_life": 90,
            },
            {
                "name": "Sona Masoori Raw Rice",
                "category": ProductCategory.GRAIN.value,
                "variety": "BPT 5204",
                "description": "Aged medium-grain fragrant Sona Masoori paddy milled freshly. Low starch, non-sticky texture, popular kitchen staple.",
                "total_qty": 5000,
                "available_qty": 4500,
                "price": 48.00,
                "shelf_life": 180,
            },
            {
                "name": "Fresh Banganapalle Mangoes",
                "category": ProductCategory.FRUIT.value,
                "variety": "Banganapalle (Benishan)",
                "description": "Naturally orchard-ripened royal Banganapalle sweet mangoes. Fiberless pulp with rich honey aroma. Direct orchard harvest.",
                "total_qty": 1200,
                "available_qty": 1185,
                "price": 95.00,
                "shelf_life": 10,
            },
            {
                "name": "Organic Turmeric Rhizomes",
                "category": ProductCategory.SPICE.value,
                "variety": "Salem Erode",
                "description": "High-curcumin organic cured turmeric fingers. Rich bright golden powder yield with certified zero chemical additives.",
                "total_qty": 600,
                "available_qty": 600,
                "price": 110.00,
                "shelf_life": 120,
            },
            {
                "name": "Nashik Red Onions",
                "category": ProductCategory.VEGETABLE.value,
                "variety": "Garwa Late Kharif",
                "description": "Crisp, pungent red onions with tight outer layers. Hand-sorted and graded at farm gate for long transit resilience.",
                "total_qty": 2500,
                "available_qty": 2500,
                "price": 28.00,
                "shelf_life": 30,
            },
            {
                "name": "Green Moong Dal",
                "category": ProductCategory.PULSE.value,
                "variety": "Pusa Vishal Whole",
                "description": "Unpolished green gram pulses direct from rainfed Telangana harvest. Rich in protein and essential minerals.",
                "total_qty": 1000,
                "available_qty": 1000,
                "price": 92.00,
                "shelf_life": 120,
            },
            {
                "name": "Yellaki Sweet Bananas",
                "category": ProductCategory.FRUIT.value,
                "variety": "Yellaki Elaichi",
                "description": "Small-sized naturally ripened sweet Yellaki bananas. High potassium content, excellent flavor.",
                "total_qty": 1800,
                "available_qty": 1800,
                "price": 32.00,
                "shelf_life": 5,
            },
            {
                "name": "Yellow Mustard Seeds",
                "category": ProductCategory.OILSEED.value,
                "variety": "Pusa Mustard 25",
                "description": "Cleaned and sieved whole yellow mustard seeds. High oil yield and aromatic spice character.",
                "total_qty": 900,
                "available_qty": 900,
                "price": 65.00,
                "shelf_life": 150,
            },
        ]

        for item in listings_catalog:
            pl = ProduceListing(
                farmer_profile_id=fp.id,
                farm_id=farm.id,
                product_name=item["name"],
                category=item["category"],
                variety=item["variety"],
                description=item["description"],
                total_quantity=item["total_qty"],
                available_quantity=item["available_qty"],
                reserved_quantity=item["total_qty"] - item["available_qty"],
                sold_quantity=0,
                quantity_unit=QuantityUnit.KG.value,
                quality_grade=QualityGrade.GRADE_A.value,
                harvest_date=today - datetime.timedelta(days=2),
                available_from=today - datetime.timedelta(days=1),
                available_until=today + datetime.timedelta(days=item["shelf_life"]),
                expected_price=item["price"],
                price_unit=PriceUnit.PER_KG.value,
                minimum_order_quantity=1,
                status=ProduceStatus.LISTED.value,
                approved_at=datetime.datetime.now(datetime.timezone.utc),
                submitted_at=datetime.datetime.now(datetime.timezone.utc),
            )
            db.add(pl)
            created_listings.append(pl)
        db.commit()
        logger.info(f"Seeded {len(created_listings)} produce listings for farm gate marketplace.")
    else:
        created_listings = db.query(ProduceListing).filter_by(farmer_profile_id=fp.id).all()

    # 4. Seed Logistics Vehicles
    vehicle_count = db.query(Vehicle).filter_by(logistics_user_id=logistics_profile_obj.id).count()
    if vehicle_count == 0:
        vehicles_data = [
            {
                "number": "AP 28 TA 1234",
                "type": "Tata Ace Reefer (1.5T)",
                "capacity": 1500,
                "status": "AVAILABLE",
                "lat": 17.2403,
                "lng": 78.4294,
            },
            {
                "number": "TS 07 UA 5678",
                "type": "Ashok Leyland Dost (2.5T)",
                "capacity": 2500,
                "status": "AVAILABLE",
                "lat": 17.3850,
                "lng": 78.4867,
            },
            {
                "number": "TS 09 EA 9012",
                "type": "Eicher Pro Reefer (7.0T)",
                "capacity": 7000,
                "status": "AVAILABLE",
                "lat": 17.4401,
                "lng": 78.3489,
            },
        ]
        for v_data in vehicles_data:
            v = Vehicle(
                logistics_user_id=logistics_profile_obj.id,
                vehicle_number=v_data["number"],
                vehicle_type=v_data["type"],
                capacity=v_data["capacity"],
                availability_status=v_data["status"],
                current_latitude=v_data["lat"],
                current_longitude=v_data["lng"],
            )
            db.add(v)
        db.commit()
        logger.info("Seeded 3 logistics fleet vehicles.")

    # 5. Seed Buyer Address
    buyer_addr = db.query(BuyerAddress).filter_by(buyer_user_id=buyer_profile_obj.id).first()
    if not buyer_addr:
        buyer_addr = BuyerAddress(
            buyer_user_id=buyer_profile_obj.id,
            full_name=buyer_profile_obj.full_name,
            phone="+919876543210",
            address_line1="Warehouse Complex 4B, Mandi Market Road",
            district="Hyderabad",
            state="Telangana",
            pincode="500011",
            is_default=True,
        )
        db.add(buyer_addr)
        db.commit()
        db.refresh(buyer_addr)

    # 6. Seed Sample Orders & Farmer Earnings
    order_count = db.query(Order).count()
    if order_count == 0 and created_listings:
        tomato_listing = next((l for l in created_listings if "Tomato" in l.product_name), created_listings[0])
        rice_listing = next((l for l in created_listings if "Rice" in l.product_name), created_listings[0])

        addr_snapshot = {
            "full_name": buyer_addr.full_name,
            "phone": buyer_addr.phone,
            "address_line1": buyer_addr.address_line1,
            "district": buyer_addr.district,
            "state": buyer_addr.state,
            "pincode": buyer_addr.pincode,
        }

        # Order 1: Delivered Rice Order
        order1 = Order(
            order_number="MD-202609-00101",
            buyer_user_id=buyer_profile_obj.id,
            status=OrderStatus.DELIVERED.value,
            payment_status=PaymentStatus.PAID.value,
            subtotal=24000.00,
            delivery_fee=800.00,
            total_amount=24800.00,
            delivery_address_id=buyer_addr.id,
            delivery_address_snapshot=addr_snapshot,
            buyer_notes="Please unload directly at bay 3.",
        )
        db.add(order1)
        db.commit()
        db.refresh(order1)

        item1 = OrderItem(
            order_id=order1.id,
            produce_listing_id=rice_listing.id,
            farmer_profile_id=fp.id,
            product_name=rice_listing.product_name,
            quantity=500.00,
            unit_price=48.00,
            subtotal=24000.00,
            quantity_unit="KG",
        )
        db.add(item1)
        db.commit()
        db.refresh(item1)

        # Farmer Earning for Order 1 (Paid)
        earning1 = FarmerEarning(
            farmer_profile_id=fp.id,
            order_id=order1.id,
            order_item_id=item1.id,
            product_name=rice_listing.product_name,
            quantity=500.00,
            quantity_unit="KG",
            unit_price=48.00,
            gross_amount=24000.00,
            platform_fee=0.00,
            logistics_fee=0.00,
            other_deductions=0.00,
            net_amount=24000.00,
            status=EarningStatus.PAID.value,
        )
        db.add(earning1)

        # Order 2: Out for delivery Tomatoes Order
        order2 = Order(
            order_number="MD-202609-00102",
            buyer_user_id=buyer_profile_obj.id,
            status=OrderStatus.OUT_FOR_DELIVERY.value,
            payment_status=PaymentStatus.PAID.value,
            subtotal=4800.00,
            delivery_fee=450.00,
            total_amount=5250.00,
            delivery_address_id=buyer_addr.id,
            delivery_address_snapshot=addr_snapshot,
            buyer_notes="Delicate crate handling requested for tomatoes.",
        )
        db.add(order2)
        db.commit()
        db.refresh(order2)

        item2 = OrderItem(
            order_id=order2.id,
            produce_listing_id=tomato_listing.id,
            farmer_profile_id=fp.id,
            product_name=tomato_listing.product_name,
            quantity=200.00,
            unit_price=24.00,
            subtotal=4800.00,
            quantity_unit="KG",
        )
        db.add(item2)
        db.commit()
        db.refresh(item2)

        earning2 = FarmerEarning(
            farmer_profile_id=fp.id,
            order_id=order2.id,
            order_item_id=item2.id,
            product_name=tomato_listing.product_name,
            quantity=200.00,
            quantity_unit="KG",
            unit_price=24.00,
            gross_amount=4800.00,
            platform_fee=0.00,
            logistics_fee=0.00,
            other_deductions=0.00,
            net_amount=4800.00,
            status=EarningStatus.PENDING_SETTLEMENT.value,
        )
        db.add(earning2)

        # Order 3: Small Consumer Household Order
        order3 = Order(
            order_number="MD-202609-00103",
            buyer_user_id=consumer_profile_obj.id,
            status=OrderStatus.ACCEPTED.value,
            payment_status=PaymentStatus.PAID.value,
            subtotal=1425.00,
            delivery_fee=100.00,
            total_amount=1525.00,
            delivery_address_id=buyer_addr.id,
            delivery_address_snapshot={
                "full_name": consumer_profile_obj.full_name,
                "phone": consumer_profile_obj.phone,
                "address_line1": "House 12-4, Madhapur",
                "district": "Hyderabad",
                "state": "Telangana",
                "pincode": "500081",
            },
            buyer_notes="Fresh ripe mangoes for home consumption.",
        )
        db.add(order3)
        db.commit()
        db.refresh(order3)

        mango_listing = next((l for l in created_listings if "Mango" in l.product_name), created_listings[0])
        item3 = OrderItem(
            order_id=order3.id,
            produce_listing_id=mango_listing.id,
            farmer_profile_id=fp.id,
            product_name=mango_listing.product_name,
            quantity=15.00,
            unit_price=95.00,
            subtotal=1425.00,
            quantity_unit="KG",
        )
        db.add(item3)
        db.commit()
        db.refresh(item3)

        earning3 = FarmerEarning(
            farmer_profile_id=fp.id,
            order_id=order3.id,
            order_item_id=item3.id,
            product_name=mango_listing.product_name,
            quantity=15.00,
            quantity_unit="KG",
            unit_price=95.00,
            gross_amount=1425.00,
            platform_fee=0.00,
            logistics_fee=0.00,
            other_deductions=0.00,
            net_amount=1425.00,
            status=EarningStatus.EXPECTED.value,
        )
        db.add(earning3)
        db.commit()
        db.commit()
        logger.info("Seeded 3 demo orders with items and farmer earnings.")

    logger.info("Demo data seeding completed successfully!")
