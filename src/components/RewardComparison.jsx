import { useState, useEffect } from "react";
import api from "../lib/api";
import "../styles/RewardComparison.css";

export default function RewardComparison() {
  const [purchaseAmount, setPurchaseAmount] = useState(10000);
  const [category, setCategory] = useState("flipkart");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "flipkart", label: "Flipkart" },
    { value: "amazon", label: "Amazon" },
    { value: "online_shopping", label: "Online Shopping" },
    { value: "dining", label: "Dining" },
    { value: "travel", label: "Travel" },
    { value: "fuel", label: "Fuel & Toll" },
    { value: "default", label: "General Purchase" },
  ];

  useEffect(() => {
    // Initial comparison on mount
    compareCards();
  }, []);

  const compareCards = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.post("/rewards/compare", {
        purchase_amount: purchaseAmount,
        category,
      });
      setComparison(response.data);
    } catch (err) {
      setError("Failed to compare cards: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    compareCards();
  };

  return (
    <div className="reward-comparison">
      <h2>💳 Credit Card Reward Finder</h2>

      <form onSubmit={handleCompare} className="comparison-form">
        <div className="form-group">
          <label htmlFor="amount">Purchase Amount (₹)</label>
          <input
            id="amount"
            type="number"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(Number(e.target.value))}
            min="100"
            step="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="compare-btn">
          {loading ? "Comparing..." : "Compare Cards"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {comparison && (
        <div className="comparison-results">
          <div className="best-card">
            <h3>🏆 Best Card for This Purchase</h3>
            <div className="card-result">
              <h4>{comparison.best_card.card_name}</h4>
              <p className="issuer">{comparison.best_card.issuer}</p>
              <div className="reward-value">
                <span className="amount">₹{comparison.best_card.reward_value_inr.toFixed(2)}</span>
                <span className="percentage">({comparison.best_card.reward_percentage.toFixed(2)}%)</span>
              </div>
              <p className="reward-type">
                {comparison.best_card.reward_type.toUpperCase()}
              </p>
              <p className="annual-savings">
                📊 Est. annual savings: <strong>₹{comparison.estimated_annual_savings.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <div className="top-cards">
            <h3>🎯 Top 5 Cards by Reward Value</h3>
            <div className="cards-grid">
              {comparison.top_5_cards.map((card, idx) => (
                <div
                  key={idx}
                  className={`card-item ${idx === 0 ? "best" : ""}`}
                >
                  <div className="rank">#{idx + 1}</div>
                  <h5>{card.card_name}</h5>
                  <p className="issuer-sm">{card.issuer}</p>
                  <div className="reward-badge">
                    <span className="amount-sm">
                      ₹{card.reward_value_inr.toFixed(2)}
                    </span>
                  </div>
                  {card.monthly_cap_applied && (
                    <p className="cap-note">⚠️ Monthly cap applied</p>
                  )}
                  {card.is_excluded && (
                    <p className="excluded-note">❌ Not eligible</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="comparison-summary">
            <p>
              Compared <strong>{comparison.total_cards_compared}</strong> credit cards
              for a <strong>₹{comparison.purchase_amount}</strong> purchase in{" "}
              <strong>{comparison.category}</strong> category
            </p>
          </div>
        </div>
      )}

      {loading && <div className="loading">Loading card comparisons...</div>}
    </div>
  );
}
