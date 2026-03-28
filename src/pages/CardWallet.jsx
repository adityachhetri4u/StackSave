import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import RewardsSummary from "../components/RewardsSummary";
import "../styles/CardWallet.css";

export default function CardWallet() {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    card_name: "",
    bank_name: "",
    card_type: "Credit",
    cashback_rate: 0,
    max_cap: 0,
    credit_card_product_id: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchCards();
  }, [user, authLoading]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cards");
      setCards(response.data);
    } catch (err) {
      setError("Failed to load cards: " + (err.response?.data?.detail || err.message));
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("rate") || name.includes("cap") ? Number(value) : value,
    }));
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await api.post("/cards", formData);
      setSuccess("Card added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setFormData({
        card_name: "",
        bank_name: "",
        card_type: "Credit",
        cashback_rate: 0,
        max_cap: 0,
        credit_card_product_id: "",
      });
      setShowForm(false);
      fetchCards();
    } catch (err) {
      setError("Failed to add card: " + (err.response?.data?.detail || err.message));
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = async (cardId) => {
    try {
      setLoading(true);
      await api.delete(`/cards/${cardId}`);
      setSuccess("Card removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchCards();
    } catch (err) {
      setError("Failed to remove card: " + (err.response?.data?.detail || err.message));
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="card-wallet-container">Authenticating...</div>;
  }

  if (!user) {
    return <div className="card-wallet-container">Please log in to manage your cards.</div>;
  }

  return (
    <div className="card-wallet-container">
      <div className="card-wallet-header">
        <h2>💳 Your Saved Cards</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="add-card-btn"
          disabled={loading}
        >
          {showForm ? "Cancel" : "➕ Add Card"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <form onSubmit={handleAddCard} className="add-card-form">
          <div className="form-row">
            <div className="form-group">
              <label>Card Name</label>
              <input
                type="text"
                name="card_name"
                value={formData.card_name}
                onChange={handleInputChange}
                placeholder="e.g., Amazon Pay ICICI"
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="e.g., ICICI Bank"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Card Type</label>
              <select name="card_type" value={formData.card_type} onChange={handleInputChange}>
                <option>Credit</option>
                <option>Debit</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cashback Rate (%)</label>
              <input
                type="number"
                name="cashback_rate"
                value={formData.cashback_rate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Max Cap (₹)</label>
              <input
                type="number"
                name="max_cap"
                value={formData.max_cap}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Card"}
          </button>
        </form>
      )}

      {cards && cards.length > 0 ? (
        <>
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="card-item">
                <div className="card-header">
                  <h3>{card.card_name}</h3>
                  <button
                    onClick={() => handleRemoveCard(card.id)}
                    className="remove-btn"
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
                <p className="card-bank">{card.bank_name}</p>
                <p className="card-type">{card.card_type}</p>
                {card.cashback_rate > 0 && (
                  <p className="card-reward">
                    💰 {card.cashback_rate}% cashback
                    {card.max_cap > 0 && ` (up to ₹${card.max_cap})`}
                  </p>
                )}
              </div>
            ))}
          </div>

          <RewardsSummary userCards={cards} />
        </>
      ) : (
        <div className="empty-state">
          <p>No cards added yet. Click "Add Card" to get started!</p>
        </div>
      )}
    </div>
  );
}
