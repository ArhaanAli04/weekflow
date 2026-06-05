let _connected = true;

export function setConnected(v: boolean): void {
  _connected = v;
}

export function getConnected(): boolean {
  return _connected;
}
