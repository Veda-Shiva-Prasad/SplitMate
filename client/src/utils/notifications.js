const DAY_MS = 24 * 60 * 60 * 1000;

export const buildNotifications = ({
  transactions = [],
  budgets = [],
  goals = [],
  recurring = [],
}) => {
  const notifications = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Budget alerts: calculate expense totals by category.
  budgets.forEach((budget) => {
    if (!budget || !budget.category || !(budget.limit > 0)) {
      return;
    }

    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === budget.category,
      )
      .reduce(
        (total, transaction) =>
          total + Math.abs(Number(transaction.amount) || 0),
        0,
      );

    const percentage = (spent / budget.limit) * 100;

    if (percentage >= 80) {
      notifications.push({
        id: `budget-${budget._id || budget.category}`,
        type: "budget",
        title: "Budget limit approaching",
        message: `${budget.category} spending has reached ${Math.round(
          percentage,
        )}% of its budget.`,
        createdAt: now.toISOString(),
        priority: percentage >= 100 ? "high" : "medium",
      });
    }
  });

  // Goal progress alerts.
  goals.forEach((goal) => {
    if (!goal || goal.archived || !(Number(goal.target) > 0)) {
      return;
    }

    const saved = Number(goal.saved) || 0;
    const target = Number(goal.target);
    const percentage = Math.min((saved / target) * 100, 100);

    if (percentage >= 25) {
      notifications.push({
        id: `goal-${goal._id}`,
        type: "goal",
        title: "Savings goal progress",
        message: `${goal.name || "Your goal"} is ${Math.round(
          percentage,
        )}% complete.`,
        createdAt: now.toISOString(),
        priority: percentage >= 100 ? "high" : "low",
      });
    }
  });

  // Recurring payment reminders: due today or within seven days.
  recurring.forEach((payment) => {
    if (!payment || !payment.nextDue) {
      return;
    }

    const dueDate = new Date(payment.nextDue);

    if (Number.isNaN(dueDate.getTime())) {
      return;
    }

    const dueDay = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

    const daysUntilDue = Math.floor(
      (dueDay.getTime() - today.getTime()) / DAY_MS,
    );

    if (daysUntilDue < 0 || daysUntilDue > 7) {
      return;
    }

    const dueMessage =
      daysUntilDue === 0
        ? "is due today"
        : daysUntilDue === 1
          ? "is due tomorrow"
          : `is due in ${daysUntilDue} days`;

    notifications.push({
      id: `recurring-${payment._id}`,
      type: "recurring",
      title: "Upcoming recurring payment",
      message: `${payment.name || "Payment"} ${dueMessage}.`,
      createdAt: now.toISOString(),
      priority: daysUntilDue <= 1 ? "high" : "medium",
    });
  });

  return notifications.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };

    return (
      priority[a.priority] - priority[b.priority] ||
      a.title.localeCompare(b.title)
    );
  });
};
