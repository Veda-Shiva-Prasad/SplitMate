import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import API from "../utils/api";

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

const EMPTY_SUMMARY = {
  totalSpent: 0,
  transactionCount: 0,
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [owedList, setOwedList] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [monthlyBudget, setMonthlyBudget] = useState(20000);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const requestIdRef = useRef(0);
  const activeTokenRef = useRef(null);

  const clearUserData = useCallback(() => {
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setOwedList([]);
    setSummary(EMPTY_SUMMARY);
    setMonthlyBudget(20000);
  }, []);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const requestId = ++requestIdRef.current;

    // Immediately clear data when the authenticated session changes.
    if (activeTokenRef.current !== token) {
      activeTokenRef.current = token;
      clearUserData();
    }

    if (!token) {
      clearUserData();
      setLoading(false);
      setDataLoaded(true);
      return;
    }

    setLoading(true);
    setDataLoaded(false);

    const requests = [
      API.get("/expenses"),
      API.get("/owed"),
      API.get("/expenses/summary"),
      API.get("/budgets/limit"),
      API.get("/budgets"),
      API.get("/goals"),
    ];

    try {
      const results = await Promise.allSettled(requests);

      // Ignore responses from an older request or session.
      if (
        requestId !== requestIdRef.current ||
        localStorage.getItem("token") !== token
      ) {
        return;
      }

      const [
        expensesRes,
        owedRes,
        summaryRes,
        budgetRes,
        budgetsRes,
        goalsRes,
      ] = results;

      if (expensesRes.status === "fulfilled") {
        setTransactions(
          Array.isArray(expensesRes.value.data) ? expensesRes.value.data : [],
        );
      } else {
        console.error("Failed to load expenses:", expensesRes.reason);
        setTransactions([]);
      }

      if (owedRes.status === "fulfilled") {
        setOwedList(
          Array.isArray(owedRes.value.data) ? owedRes.value.data : [],
        );
      } else {
        console.error("Failed to load owed records:", owedRes.reason);
        setOwedList([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary({
          totalSpent: Number(summaryRes.value.data?.totalExpense) || 0,
          transactionCount:
            Number(summaryRes.value.data?.transactionCount) || 0,
        });
      } else {
        console.error("Failed to load summary:", summaryRes.reason);
        setSummary(EMPTY_SUMMARY);
      }

      if (budgetRes.status === "fulfilled") {
        const limit = Number(budgetRes.value.data?.limit);
        setMonthlyBudget(limit > 0 ? limit : 20000);
      } else {
        console.error("Failed to load monthly budget:", budgetRes.reason);
        setMonthlyBudget(20000);
      }

      if (budgetsRes.status === "fulfilled") {
        setBudgets(
          Array.isArray(budgetsRes.value.data) ? budgetsRes.value.data : [],
        );
      } else {
        console.error("Failed to load budgets:", budgetsRes.reason);
        setBudgets([]);
      }

      if (goalsRes.status === "fulfilled") {
        setGoals(Array.isArray(goalsRes.value.data) ? goalsRes.value.data : []);
      } else {
        console.error("Failed to load goals:", goalsRes.reason);
        setGoals([]);
      }

      setDataLoaded(true);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error("Error fetching application data:", error);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [clearUserData]);

  useEffect(() => {
    fetchAllData();

    return () => {
      // Invalidate requests when the provider unmounts.
      requestIdRef.current += 1;
    };
  }, [fetchAllData]);

  const refreshData = useCallback(async () => {
    setDataLoaded(false);
    await fetchAllData();
  }, [fetchAllData]);

  const value = {
    transactions,
    budgets,
    goals,
    owedList,
    summary,
    monthlyBudget,
    loading,
    dataLoaded,
    refreshData,
    fetchAllData,
    setTransactions,
    setBudgets,
    setGoals,
    setOwedList,
    setMonthlyBudget,
    setSummary,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
