import {
  AttributeIds,
  DataType,
  MessageSecurityMode,
  OPCUAClient,
  SecurityPolicy,
  Variant,
  type ClientSession,
} from "node-opcua";

export type OpcuaConnectionOptions = {
  endpointUrl: string;
  securityMode?: keyof typeof MessageSecurityMode;
  securityPolicy?: keyof typeof SecurityPolicy;
  username?: string | null;
  password?: string | null;
};

export type OpcuaConnection = {
  client: OPCUAClient;
  session: ClientSession;
};

export async function connectOpcua(
  options: OpcuaConnectionOptions,
): Promise<OpcuaConnection> {
  const client = OPCUAClient.create({
    endpointMustExist: false,
    securityMode: MessageSecurityMode[options.securityMode ?? "None"],
    securityPolicy: SecurityPolicy[options.securityPolicy ?? "None"],
  });

  await client.connect(options.endpointUrl);
  const session =
    options.username && options.password
      ? await client.createSession({
          type: "UserName",
          userName: options.username,
          password: options.password,
        })
      : await client.createSession();

  return { client, session };
}

export async function disconnectOpcua(connection: OpcuaConnection) {
  await connection.session.close();
  await connection.client.disconnect();
}

export async function readOpcuaValue(
  session: ClientSession,
  nodeId: string,
): Promise<unknown> {
  const value = await session.read({
    nodeId,
    attributeId: AttributeIds.Value,
  });

  if (value.statusCode.isNotGood()) {
    throw new Error(`OPC UA read failed for ${nodeId}: ${value.statusCode}`);
  }

  return value.value.value;
}

export async function writeOpcuaValue(
  session: ClientSession,
  nodeId: string,
  value: unknown,
  dataType: DataType = DataType.Boolean,
) {
  const result = await session.write({
    nodeId,
    attributeId: AttributeIds.Value,
    value: {
      value: new Variant({ dataType, value }),
    },
  });

  if (result.isNotGood()) {
    throw new Error(`OPC UA write failed for ${nodeId}: ${result}`);
  }
}
