import { useCallback, useEffect, useMemo, useState } from "react"
import Navbar from "./components/Navbar"
import SideRail from "./components/SideRail"
import { defaultUserProfile } from "./data/mockData"
import History from "./pages/History"
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import { simulateAnalyzeRequest } from "./services/mockApi"

const PROFILE_KEY = "stacksave_user_profile"
const HISTORY_KEY = "stacksave_history"

function App() {
  const [activeTab, setActiveTab] = useState("Terminal")
  const [isLoading, setIsLoading] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [userProfile, setUserProfile] = useState(defaultUserProfile)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_KEY)
    const storedHistory = localStorage.getItem(HISTORY_KEY)

    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile))
    }

    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile))
  }, [userProfile])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const handleAnalyze = useCallback(async (url) => {
    setIsLoading(true)

    try {
      const analysis = await simulateAnalyzeRequest(url, userProfile)

      setLastAnalysis(analysis)
      setHistory((previous) => [
        {
          id: `${Date.now()}-${analysis.product.id}`,
          product: analysis.product.name,
          platform: analysis.product.platform,
          savings: analysis.bestPaymentOption.totalSavings,
          paymentMethod: analysis.bestPaymentOption.name,
        },
        ...previous,
      ])
    } finally {
      setIsLoading(false)
    }
  }, [userProfile])

  const pageContent = useMemo(() => {
    if (activeTab === "Vault") {
      return (
        <Profile userProfile={userProfile} onUpdateProfile={setUserProfile} />
      )
    }

    if (activeTab === "History") {
      return <History history={history} />
    }

    return (
      <Home
        lastAnalysis={lastAnalysis}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
      />
    )
  }, [activeTab, handleAnalyze, history, isLoading, lastAnalysis, userProfile])

  return (
    <div className="min-h-screen bg-machine text-slate-100">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mx-auto flex w-full max-w-[1300px] gap-4 px-3 pb-6 pt-4 sm:px-5">
        <SideRail activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="machine-shell min-h-[calc(100vh-116px)] flex-1 p-4 sm:p-6">
          {pageContent}
        </main>
      </div>
    </div>
  )
}

export default App
