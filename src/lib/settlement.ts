export type Split = {
  userId: string;
  shareAmount: number;
};

export type ExpenseLike = {
  payerUserId: string;
  amount: number;
  splits: Split[];
};

export type NetBalance = {
  userId: string;
  paid: number;
  owed: number;
  net: number;
};

export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function computeNet(expenses: ExpenseLike[]): Map<string, NetBalance> {
  const map = new Map<string, NetBalance>();

  for (const expense of expenses) {
    const payer = map.get(expense.payerUserId) ?? {
      userId: expense.payerUserId,
      paid: 0,
      owed: 0,
      net: 0
    };
    payer.paid += expense.amount;
    map.set(expense.payerUserId, payer);

    for (const split of expense.splits) {
      const share = split.shareAmount ?? 0;
      const member = map.get(split.userId) ?? {
        userId: split.userId,
        paid: 0,
        owed: 0,
        net: 0
      };
      member.owed += share;
      map.set(split.userId, member);
    }
  }

  for (const balance of map.values()) {
    balance.net = balance.paid - balance.owed;
  }

  return map;
}

export function computeTransfers(balances: Map<string, NetBalance>): Transfer[] {
  const creditors = Array.from(balances.values())
    .filter((b) => b.net > 0)
    .map((b) => ({ userId: b.userId, net: b.net }))
    .sort((a, b) => b.net - a.net);
  const debtors = Array.from(balances.values())
    .filter((b) => b.net < 0)
    .map((b) => ({ userId: b.userId, net: b.net }))
    .sort((a, b) => a.net - b.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(Math.abs(debtor.net), creditor.net);
    if (amount > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount
      });
    }

    debtor.net += amount;
    creditor.net -= amount;

    if (Math.abs(debtor.net) < 1) i += 1;
    if (creditor.net < 1) j += 1;
  }

  return transfers;
}
