import { useState, useEffect } from "react";
import api from "../lib/api";
import "../styles/RewardsSummary.css";

export default function RewardsSummary({ userCards = null }) {
  const [rewards, setRewards] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userCards || userCards.length === 0) {
      calculateDefaultRewards();
    } else {
      calculateUserRewards();
    }
  }, [userCards]);

  const calculateDefaultRewards = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Calculate rewards for a typical monthly spend pattern
      const typicalPurchases = [
        { amount: 10000, category: "flipkart" },
        { amount: 8000, category: "amazon" },
        { amount: 5000, category: "dining" },
        { amount: 3000, category: "fuel" },
      ];

      let totalPoints = 0;
      const rewardsList = [];

      for (const purchase of typicalPurchases) {
        const response = await api.post("/rewards/compare", {
          purchase_amount: purchase.amount,
          category: purchase.category,
        });

        const best = response.data.best_card;
        totalPoints += best.reward_value_inr;
        
        rewardsList.push({
          category: purchase.category.charAt(0).toUpperCase() + purchase.category.slice(1),
          card: best.card_name,
          reward: best.reward_value_inr,
          amount: purchase.amount,
        });
      }

      setRewards(rewardsList);
      setTotalSavings(totalPoints);
    } catch (err) {
      setError("Failed to calculate rewards");
    } finally {
      setLoading(false);
    }
  };

  const calculateUserRewards = async () => {
    try {
      setLoading(true);
      setError("");

      // For user's actual saved cards
      const response = await api.post("/rewards/calculate", {
        purchase_amount: 10000,
        category: "default",
      });

      const totalPoints = response.data.reduce(
        (sum, calc) => sum + calc.reward_value_inr,
        0
      );
      
      setRewards(response.data);
      setTotalSavings(totalPoints);
    } catch (err) {
      setError("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rewards-summary">
      <div className="summary-card total-savings">
        <div className="summary-icon">💰</div>
        <div className="summary-content">
          <p className="summary-label">Total Potential Savings</p>
          <h3 className="summary-value">
            ₹{totalSavings.toFixed(2)}
            <span className="summary-subtitle">/month</span>
          </h3>
          <p className="summary-note">Based on typical spending patterns</p>
        </div>
      </div>

      <div className="summary-card points-earned">
        <div className="summary-icon">⭐</div>
        <div className="summary-content">
          <p className="summary-label">Credit Points Available</p>
          <h3 className="summary-value">
            {rewards.length || "0"}
            <span className="summary-subtitle">cards tracked</span>
          </h3>
          <p className="summary-note">Earning up to ₹{(totalSavings * 0.8).toFixed(0)}/month</p>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {!loading && rewards.length > 0 && (
        <div className="rewards-breakdown">
          <h4>💳 Reward Breakdown</h4>
          <div className="breakdown-list">
            {rewards.slice(0, 4).map((reward, idx) => (
              <div key={idx} className="breakdown-item">
                <span className="reward-category">{reward.category || reward.card_name}</span>
                <span className="reward-amount">₹{reward.reward_value_inr?.toFixed(2) || reward.reward?.toFixed(2) || "0"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="loading-msg">Computing rewards...</p>}
    </div>
  );
}
