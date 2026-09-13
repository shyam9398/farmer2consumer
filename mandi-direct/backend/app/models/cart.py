from sqlalchemy import Column, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ShoppingCart(BaseModel):
    """
    Database-backed shopping cart per buyer user.
    """
    __tablename__ = "shopping_carts"

    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        doc="References profiles.id of the buyer",
    )

    # Relationships
    buyer = relationship("Profile", foreign_keys=[buyer_user_id])
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ShoppingCart id={self.id} buyer_user_id={self.buyer_user_id}>"


class CartItem(BaseModel):
    """
    Individual produce item in a buyer's shopping cart with requested quantity.
    Enforces a unique item per produce listing per buyer cart.
    """
    __tablename__ = "cart_items"

    cart_id = Column(
        String(36),
        ForeignKey("shopping_carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produce_listing_id = Column(
        String(36),
        ForeignKey("produce_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity = Column(Numeric(12, 2), nullable=False)

    # Relationships
    cart = relationship("ShoppingCart", back_populates="items")
    produce = relationship("ProduceListing", foreign_keys=[produce_listing_id])

    __table_args__ = (
        UniqueConstraint("cart_id", "produce_listing_id", name="uq_cart_items_produce"),
        Index("ix_cart_items_cart_produce", "cart_id", "produce_listing_id"),
    )

    def __repr__(self) -> str:
        return f"<CartItem id={self.id} cart_id={self.cart_id} produce_id={self.produce_listing_id} qty={self.quantity}>"
