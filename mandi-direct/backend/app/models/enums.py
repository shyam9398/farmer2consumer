import enum


class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"
    FPO = "FPO"
    LOGISTICS = "LOGISTICS"
    CONSUMER = "CONSUMER"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class OwnershipType(str, enum.Enum):
    OWNED = "OWNED"
    LEASED = "LEASED"
    FAMILY = "FAMILY"
    OTHER = "OTHER"


class AreaUnit(str, enum.Enum):
    ACRE = "ACRE"
    HECTARE = "HECTARE"


class SoilType(str, enum.Enum):
    RED = "RED"
    BLACK = "BLACK"
    ALLUVIAL = "ALLUVIAL"
    LOAMY = "LOAMY"
    SANDY = "SANDY"
    CLAY = "CLAY"
    OTHER = "OTHER"


class IrrigationType(str, enum.Enum):
    RAINFED = "RAINFED"
    BOREWELL = "BOREWELL"
    CANAL = "CANAL"
    DRIP = "DRIP"
    SPRINKLER = "SPRINKLER"
    OTHER = "OTHER"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class ProduceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    LISTED = "LISTED"
    PARTIALLY_SOLD = "PARTIALLY_SOLD"
    SOLD_OUT = "SOLD_OUT"
    EXPIRED = "EXPIRED"
    ARCHIVED = "ARCHIVED"


class ProductCategory(str, enum.Enum):
    VEGETABLE = "VEGETABLE"
    FRUIT = "FRUIT"
    GRAIN = "GRAIN"
    PULSE = "PULSE"
    SPICE = "SPICE"
    OILSEED = "OILSEED"
    OTHER = "OTHER"


class QuantityUnit(str, enum.Enum):
    KG = "KG"
    QUINTAL = "QUINTAL"
    TON = "TON"


class PriceUnit(str, enum.Enum):
    PER_KG = "PER_KG"
    PER_QUINTAL = "PER_QUINTAL"
    PER_TON = "PER_TON"


class QualityGrade(str, enum.Enum):
    PREMIUM = "PREMIUM"
    GRADE_A = "GRADE_A"
    GRADE_B = "GRADE_B"
    GRADE_C = "GRADE_C"
    UNGRADED = "UNGRADED"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class EarningStatus(str, enum.Enum):
    EXPECTED = "EXPECTED"
    PENDING_SETTLEMENT = "PENDING_SETTLEMENT"
    AVAILABLE = "AVAILABLE"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class DemandLevel(str, enum.Enum):
    VERY_LOW = "VERY_LOW"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class DemandTrend(str, enum.Enum):
    RISING = "RISING"
    FALLING = "FALLING"
    STABLE = "STABLE"
    VOLATILE = "VOLATILE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class SupplyDemandStatus(str, enum.Enum):
    LOW_DEMAND = "LOW_DEMAND"
    BALANCED = "BALANCED"
    HIGH_DEMAND = "HIGH_DEMAND"
    SUPPLY_SHORTAGE = "SUPPLY_SHORTAGE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class ConfidenceLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MatchLevel(str, enum.Enum):
    VERY_LOW = "VERY_LOW"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class NotificationType(str, enum.Enum):
    AUTH = "AUTH"
    PROFILE = "PROFILE"
    VERIFICATION = "VERIFICATION"
    PRODUCE = "PRODUCE"
    ORDER = "ORDER"
    LOGISTICS = "LOGISTICS"
    PAYMENT = "PAYMENT"
    PAYOUT = "PAYOUT"
    PRICE_INTELLIGENCE = "PRICE_INTELLIGENCE"
    DEMAND_INTELLIGENCE = "DEMAND_INTELLIGENCE"
    MATCHING = "MATCHING"
    SYSTEM = "SYSTEM"




