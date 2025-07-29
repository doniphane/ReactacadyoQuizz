import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
   
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
     <div className="grid gap-3">
  <div className="flex items-center">
    <Label htmlFor="password">Mot de passe</Label>
    <a
      href="#"
      className="ml-auto text-sm underline-offset-4 hover:underline"
    >
      Mot de passe oublié ?
    </a>
  </div>
  <Input
    id="password"
    name="password"
    type="password"
    required
    placeholder="Entrez votre mot de passe"
  />
</div>

     <Button
    type="submit"
    className="w-full bg-amber-400 text-black text-xl mt-4"
  >
    Se connecter
  </Button>
       

      </div>
      <div className="text-center text-sm text-black font-bold">
        Pas de compte ?{" "}
        <a href="#" className="underline underline-offset-4  text-amber-500">
          S'inscrire
        </a>
      </div>
    </form>
  )
}
