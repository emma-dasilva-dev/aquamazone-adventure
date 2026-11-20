import {redirect} from 'next/navigation';
import {isAdminAuthenticated} from '../../../lib/admin-auth';
import AdminReviews from '../../AdminReviews';
export const dynamic='force-dynamic';
export default async function ReviewsAdminPage(){
 if(!await isAdminAuthenticated())redirect('/admin/login');
 return <AdminReviews/>;
}