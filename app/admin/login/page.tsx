import { redirect } from 'next/navigation';
import { adminAuthConfigured, isAdminAuthenticated } from '../../../lib/admin-auth';

export const dynamic='force-dynamic';
export default async function AdminLogin({searchParams}:{searchParams:Promise<{error?:string}>}) {
  if(await isAdminAuthenticated())redirect('/admin');
  const configured=adminAuthConfigured();
  const error=(await searchParams).error;
  return <main className="az-admin-login">
    <div className="az-admin-login-brand"><span className="az-admin-kicker">AQUAMAZONE ADVENTURE</span><span>Administration privée</span></div>
    <div className="az-admin-login-panel">
      <p className="az-admin-overline">ACCÈS ADMINISTRATEUR</p>
      <h1>Bienvenue.</h1>
      <p>Connectez-vous pour consulter et suivre les réservations. Accès réservé à l'administratrice.</p>
      {configured?<form action="/api/admin/login" method="post" className="az-admin-login-form">
        <label htmlFor="admin-password">Mot de passe</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required minLength={12}/>
        {error==='1'&&<p className="az-admin-form-error" role="alert">Identifiants incorrects. Réessayez.</p>}
        <button type="submit">Accéder aux réservations <span aria-hidden="true">↗</span></button>
      </form>:<p className="az-admin-form-error" role="status">La connexion administrateur n'est pas encore configurée. Aucun accès aux données n'est autorisé.</p>}
      <a className="az-admin-back" href="/">← Retour au site public</a>
    </div>
  </main>;
}
