import Link from "next/link";
import MemberRegisterForm from "@/components/Login/MemberRegisterForm";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-slate-50 overflow-hidden py-10">
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-violet-300/40 rounded-full blur-3xl animate-blob" />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-amber-300/30 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative w-full max-w-sm animate-fadeInUp">
        <div className="flex flex-col items-center gap-3 mb-6 text-slate-900 text-center">
          <img
            src="/logo.jpg"
            alt="Maharashtra Police Boys Sanghatna logo"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white object-contain p-1 shadow-md ring-1 ring-gray-200"
          />
          <span className="font-bold text-base sm:text-lg tracking-tight">
            MAHARASHTRA POLICE BOY SANGHATNA
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-semibold mb-1 text-center text-slate-900">
            Register Subscribed Account
          </h1>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Create a member account to access the full registry
          </p>
          <MemberRegisterForm />
          <p className="text-sm text-gray-500 text-center mt-4">
            Already a member?{" "}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
