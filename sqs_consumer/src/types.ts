export type DataType = {
  Type: string;
  Value: string;
};

export type SNSMessage = {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL: string;
  MessageAttributes: {
    "data.targetType": DataType;
    type: DataType;
    version: DataType;
  };
};

export type OrganizationUpdate = {
  id: string;
  name: string;
  reporting_account_id: number;
  organization_group_id: string;
};

export type UserUpdate = {
  id: string;
  external_id?: string;
  email: string;
  name: string;
  username: string;
  family_name?: string;
  given_name?: string;
  time_zone?: string;
  active: boolean;
  user_tier_id: number;
  group_ids: string[];
  created_at: number;
  updated_at: number;
};

export type UserPasswordChanged = {
  user_id: string;
};

export type OrganizationUpdateMessage = MessageBodyWithData<OrganizationUpdate>;
export type UserUpdateMessage = MessageBodyWithData<UserUpdate>;
export type UserAddRolesMessage = MessageBody;
export type UserPasswordChangedMessage =
  MessageBodyWithData<UserPasswordChanged>;

export type SqsMessageListener = {
  onOrganizationUpdate: (message: OrganizationUpdateMessage) => void;
  onOrganizationCreate: (message: OrganizationUpdateMessage) => void;
  onOrganizationDelete: (message: OrganizationUpdateMessage) => void;
  onUserCreate: (message: UserUpdateMessage) => void;
  onUserUpdate: (message: UserUpdateMessage) => void;
  onUserDelete: (message: UserUpdateMessage) => void;
  // onUserSelfTierChange: (message: UserUpdateMessage) => void;
  // onUserAddRoles: (message: UserAddRolesMessage) => void;
  // onUserPasswordChanged: (message: UserPasswordChangedMessage) => void;
};

export type MessageBodyTargetData<T> = MessageBodyTarget & {
  target: T;
};

export type MessageBodyTarget = {
  targetType: string;
  type: string;
  version: string;
};

export type MessageBodyWithData<T> = MessageBodyBase<MessageBodyTargetData<T>>;
export type MessageBody = MessageBodyBase<MessageBodyTarget>;

export type MessageBodyBase<T> = {
  id: string;
  data: T;
  meta: {
    occurredAt: number;
    originatingService: string;
    summary: string;
  };
  type: string;
  version: string;
};

export type Logger = {
  error:
    | ((message: string) => void)
    | ((message: string, ...params: unknown[]) => void);
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};
