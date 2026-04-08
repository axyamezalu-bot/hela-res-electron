export interface PartialCut {
  id: string;
  cashRegisterDate: string;
  cutTime: string;
  cashierId: string;
  cashierName: string;
  initialAmount: number;
  salesCash: number;
  salesCredit: number;
  deposits: number;
  expenses: number;
  physicalCash: number;
  expectedCash: number;
  difference: number;
  notes?: string;
  createdAt: string;
}
