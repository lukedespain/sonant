import { redirect } from 'next/navigation';

// The questions live at the bottom of the portal homepage now.
export default function FaqPage() {
  redirect('/#faq');
}
