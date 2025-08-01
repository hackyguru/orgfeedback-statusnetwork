import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrgFeedback", (m) => {
  const orgFeedback = m.contract("OrgFeedback");
  
  return { orgFeedback };
});