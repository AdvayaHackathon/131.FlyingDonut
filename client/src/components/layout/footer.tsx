import { Heart, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-semibold text-primary">MediConnect</span>
            </div>
            <p className="text-sm text-gray-500">
              Connecting doctors and patients for better healthcare outcomes.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">For Patients</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/doctors">
                  <a className="text-gray-500 hover:text-primary">Find Doctors</a>
                </Link>
              </li>
              <li>
                <Link href="/appointments">
                  <a className="text-gray-500 hover:text-primary">Book Appointments</a>
                </Link>
              </li>
              <li>
                <Link href="/health-records">
                  <a className="text-gray-500 hover:text-primary">Health Records</a>
                </Link>
              </li>
              <li>
                <Link href="/support-groups">
                  <a className="text-gray-500 hover:text-primary">Support Groups</a>
                </Link>
              </li>
              <li>
                <Link href="/resources">
                  <a className="text-gray-500 hover:text-primary">Health Resources</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">For Doctors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/profile-management">
                  <a className="text-gray-500 hover:text-primary">Profile Management</a>
                </Link>
              </li>
              <li>
                <Link href="/patient-connection">
                  <a className="text-gray-500 hover:text-primary">Patient Connection</a>
                </Link>
              </li>
              <li>
                <Link href="/appointment-scheduling">
                  <a className="text-gray-500 hover:text-primary">Appointment Scheduling</a>
                </Link>
              </li>
              <li>
                <Link href="/network">
                  <a className="text-gray-500 hover:text-primary">Professional Network</a>
                </Link>
              </li>
              <li>
                <Link href="/resources-research">
                  <a className="text-gray-500 hover:text-primary">Resources & Research</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">About Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mission">
                  <a className="text-gray-500 hover:text-primary">Our Mission</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-gray-500 hover:text-primary">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-gray-500 hover:text-primary">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-500 hover:text-primary">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <a className="text-gray-500 hover:text-primary">Careers</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MediConnect. All rights reserved. HIPAA Compliant Platform.</p>
        </div>
      </div>
    </footer>
  );
}
