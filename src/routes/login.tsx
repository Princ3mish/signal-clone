import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Toaster } from "../components/Toaster";
import { useUiStore } from "../stores/uiStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Signal" },
      { name: "description", content: "Sign in or create your Signal account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const toast = useUiStore((s) => s.toast);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [form, setForm] = useState({
    identifier: "",
    phone: "",
    username: "",
    displayName: "",
    password: "",
    otp: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        if (form.otp !== "000000") {
          toast("Invalid OTP — hint: 000000");
          return;
        }
        await register({
          username: form.username || "alice",
          phone_number: form.phone || "+1 202 555 0101",
          display_name: form.displayName || "Alice",
          password: form.password || "password123",
        });
      } else {
        await login({ username: form.identifier, password: form.password });
      }
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast(msg || "Something went wrong — check your credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-blue">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-text-primary">Signal</h1>
          <p className="text-sm text-text-secondary">{mode === "login" ? "Welcome back" : "Create your account"}</p>
        </div>

        {mode === "register" && (
          <div className="mb-4 flex justify-center">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              {avatar ? (
                <img src={avatar} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-text-secondary">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"/></svg>
                </div>
              )}
            </label>
          </div>
        )}

        <div className="space-y-3">
          {mode === "login" ? (
            <>
              <Field placeholder="Username or phone" value={form.identifier} onChange={set("identifier")} />
              <Field placeholder="Password" type="password" value={form.password} onChange={set("password")} />
            </>
          ) : (
            <>
              <Field placeholder="Phone number" value={form.phone} onChange={set("phone")} />
              <Field placeholder="Username" value={form.username} onChange={set("username")} />
              <Field placeholder="Display name" value={form.displayName} onChange={set("displayName")} />
              <Field placeholder="Password" type="password" value={form.password} onChange={set("password")} />
              <Field placeholder="OTP code (hint: 000000)" value={form.otp} onChange={set("otp")} />
            </>
          )}
        </div>

        <button type="submit" className="mt-5 w-full rounded-lg bg-signal-blue py-2.5 font-medium text-white">
          {mode === "login" ? "Login" : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-medium text-signal-blue">
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </form>
      <Toaster />
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-signal-blue"
    />
  );
}
