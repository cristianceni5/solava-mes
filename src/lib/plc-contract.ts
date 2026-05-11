export type PlcHandshakeState = {
  datoPronte: boolean;
  datoLetto: boolean;
  lastLabel: string | null;
  updatedAt: string | null;
};

export const PLC_HTTP_PORT = 8031;
