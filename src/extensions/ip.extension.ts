import os from "os";

export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (!networkInterface) {
      continue;
    }

    for (const item of networkInterface) {
      if (item.family === "IPv4" && !item.internal) {
        return item.address;
      }
    }
  }
  return "Unable to determine IP address";
}
