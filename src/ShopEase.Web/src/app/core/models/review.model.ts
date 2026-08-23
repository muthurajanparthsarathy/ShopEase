export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStats {
  avg: number;
  count: number;
}

export interface ReviewInput {
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
}
