export type DomainErrorCode =
  | 'ACTIVE_SESSION_ALREADY_EXISTS'
  | 'ORDER_SESSION_CLOSED'
  | 'UNAUTHORIZED_HOST_ACTION'
  | 'UNAUTHORIZED_ITEM_MUTATION'
  | 'UNAUTHORIZED_SESSION_DELETION'
  | 'RESOURCE_NOT_FOUND'
  | 'MENU_NOT_AVAILABLE';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly statusCode: number;

  constructor(code: DomainErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
