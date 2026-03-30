import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { backend } from "../backendActor";
import { hashPassword, saveSession } from "../utils/auth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRegisterSuccess?: () => void;
  defaultTab?: "register" | "login";
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  onRegisterSuccess,
  defaultTab = "register",
}: AuthModalProps) {
  const [tab, setTab] = useState<"register" | "login">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [regNickname, setRegNickname] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [loginNickname, setLoginNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNickname.trim()) {
      toast.error("Bitte geben Sie einen Nicknamen ein.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(regPassword);
      const result = await backend.register(regNickname.trim(), hash);
      if (result.__kind__ === "error") {
        toast.error(result.error);
        return;
      }
      // Auto-login after registration
      const loginResult = await backend.login(regNickname.trim(), hash);
      if (loginResult.__kind__ === "error") {
        toast.error(loginResult.error);
        return;
      }
      saveSession({ token: loginResult.ok, nickname: regNickname.trim() });
      toast.success("Konto erstellt! Willkommen bei SDR.");
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        onSuccess();
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNickname.trim() || !loginPassword) {
      toast.error("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(loginPassword);
      const result = await backend.login(loginNickname.trim(), hash);
      if (result.__kind__ === "error") {
        toast.error("Ungültiger Benutzername oder Passwort.");
        return;
      }
      saveSession({ token: result.ok, nickname: loginNickname.trim() });
      toast.success(`Willkommen zurück, ${loginNickname.trim()}!`);
      onSuccess();
    } catch {
      toast.error("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{
          background: "oklch(0.17 0.03 248)",
          border: "1px solid oklch(0.27 0.055 248)",
          borderRadius: "1rem",
        }}
        data-ocid="auth.modal"
      >
        <DialogHeader className="px-8 pt-8 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.13 218 / 0.15)",
                border: "1px solid oklch(0.72 0.13 218 / 0.3)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
            <DialogTitle
              className="text-xl font-bold font-display"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              SDR – SichereDeineRechte
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "register" | "login")}
          className="px-8 pb-8"
        >
          <TabsList
            className="grid grid-cols-2 w-full mb-6"
            style={{
              background: "oklch(0.13 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="auth.tab"
          >
            <TabsTrigger
              value="register"
              data-ocid="auth.register.tab"
              className="text-base"
              style={{ fontWeight: 500 }}
            >
              Registrieren
            </TabsTrigger>
            <TabsTrigger
              value="login"
              data-ocid="auth.login.tab"
              className="text-base"
              style={{ fontWeight: 500 }}
            >
              Anmelden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Nickname
                </Label>
                <Input
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  placeholder="Ihr Nickname"
                  disabled={loading}
                  autoComplete="username"
                  className="text-base"
                  style={{
                    background: "oklch(0.13 0.03 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                    color: "oklch(0.96 0.015 230)",
                  }}
                  data-ocid="auth.register.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    disabled={loading}
                    autoComplete="new-password"
                    className="text-base"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                      paddingRight: "2.5rem",
                    }}
                    data-ocid="auth.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Passwort bestätigen
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Passwort wiederholen"
                  disabled={loading}
                  autoComplete="new-password"
                  className="text-base"
                  style={{
                    background: "oklch(0.13 0.03 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                    color: "oklch(0.96 0.015 230)",
                  }}
                  data-ocid="auth.confirm_password.input"
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-2 text-base font-semibold btn-cyan"
                disabled={loading}
                data-ocid="auth.register.submit_button"
                style={{
                  background: "oklch(0.72 0.13 218)",
                  color: "oklch(0.135 0.025 248)",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {loading ? "Wird erstellt…" : "Konto erstellen"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Nickname
                </Label>
                <Input
                  value={loginNickname}
                  onChange={(e) => setLoginNickname(e.target.value)}
                  placeholder="Ihr Nickname"
                  disabled={loading}
                  autoComplete="username"
                  className="text-base"
                  style={{
                    background: "oklch(0.13 0.03 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                    color: "oklch(0.96 0.015 230)",
                  }}
                  data-ocid="auth.login.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ihr Passwort"
                    disabled={loading}
                    autoComplete="current-password"
                    className="text-base"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                      paddingRight: "2.5rem",
                    }}
                    data-ocid="auth.login_password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-2 text-base font-semibold"
                disabled={loading}
                data-ocid="auth.login.submit_button"
                style={{
                  background: "oklch(0.72 0.13 218)",
                  color: "oklch(0.135 0.025 248)",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {loading ? "Wird angemeldet…" : "Anmelden"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
