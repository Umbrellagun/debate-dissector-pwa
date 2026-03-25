export interface Comment {
  id: string;
  text: string;
  selectedText: string; // The text that was highlighted when comment was created
  parentId?: string; // For threading - reply to another comment
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}
