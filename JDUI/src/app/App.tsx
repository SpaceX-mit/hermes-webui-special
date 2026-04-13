import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Step1EnvCheck } from "./components/Step1EnvCheck";
import { Step2ModelSelect } from "./components/Step2ModelSelect";
import { Step2ApiKey } from "./components/Step2ApiKey";
import { Step3CreateEmployee } from "./components/Step3CreateEmployee";
import { Step3Confirm } from "./components/Step3Confirm";
import { Step4Loading } from "./components/Step4Loading";
import { Step5Chat } from "./components/Step5Chat";

type StepKey =
  | "env"
  | "model"
  | "apikey"
  | "employee"
  | "confirm"
  | "loading"
  | "chat";

export default function App() {
  const [step, setStep] = useState<StepKey>("env");
  const [employeeName, setEmployeeName] = useState("1 号员工");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [employeeDescription, setEmployeeDescription] = useState("");

  const currentStep =
    step === "env"
      ? 1
      : step === "employee" || step === "confirm" || step === "loading"
        ? 3
        : 2;

  const isChat = step === "chat";

  return (
    <div className="size-full flex items-center justify-center bg-[#232323]">
      <div className="flex w-full h-full rounded-[24px] overflow-clip">

        {/* Setup wizard sidebar – collapses to zero on chat transition */}
        <AnimatePresence>
          {!isChat && (
            <motion.div
              key="wizard-sidebar"
              initial={{ width: "320px" }}
              animate={{ width: "320px" }}
              exit={{ width: "0px" }}
              transition={{ duration: 0.52, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden shrink-0 h-full"
            >
              <Sidebar currentStep={currentStep} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main right area */}
        <div className="bg-[#232323] flex-1 h-full relative min-w-0">
          <AnimatePresence mode="wait">
            {!isChat ? (
              /* ── Wizard content ── */
              <motion.div
                key="wizard-content"
                className="size-full"
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex flex-col justify-center overflow-clip size-full">
                  <div className="flex flex-col items-start justify-center pr-[8px] py-[8px] size-full">
                    <div className="bg-[#f5f5f5] flex-1 rounded-[20px] w-full overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        {step === "env" && (
                          <motion.div
                            key="env"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step1EnvCheck onNext={() => setStep("model")} />
                          </motion.div>
                        )}
                        {step === "model" && (
                          <motion.div
                            key="model"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step2ModelSelect
                              onNext={() => setStep("employee")}
                              onCustomApiKey={() => setStep("apikey")}
                            />
                          </motion.div>
                        )}
                        {step === "apikey" && (
                          <motion.div
                            key="apikey"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step2ApiKey
                              onBack={() => setStep("model")}
                              onNext={() => setStep("employee")}
                            />
                          </motion.div>
                        )}
                        {step === "employee" && (
                          <motion.div
                            key="employee"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step3CreateEmployee
                              onBack={() => setStep("model")}
                              onFinish={() => setStep("confirm")}
                              employeeName={employeeName}
                              onEmployeeNameChange={setEmployeeName}
                              selectedAvatarIndex={selectedAvatarIndex}
                              onAvatarChange={setSelectedAvatarIndex}
                              description={employeeDescription}
                              onDescriptionChange={setEmployeeDescription}
                            />
                          </motion.div>
                        )}
                        {step === "confirm" && (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step3Confirm
                              onBack={() => setStep("employee")}
                              onFinish={() => setStep("loading")}
                              employeeName={employeeName}
                              avatarIndex={selectedAvatarIndex}
                              description={employeeDescription}
                            />
                          </motion.div>
                        )}
                        {step === "loading" && (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="size-full"
                          >
                            <Step4Loading
                              avatarIndex={selectedAvatarIndex}
                              onFinish={() => setStep("chat")}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── Chat view ── */
              <motion.div
                key="chat-content"
                className="size-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.28 }}
              >
                <Step5Chat
                  avatarIndex={selectedAvatarIndex}
                  employeeName={employeeName}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
