import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { z } from "zod";
import { InsertAppointment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoctorId?: number;
}

// Create appointment schema
const appointmentSchema = z.object({
  date: z.date({
    required_error: "Please select an appointment date",
  }),
  time: z.string({
    required_error: "Please select an appointment time",
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200),
  notes: z.string().max(500).nullable().optional(),
  isVirtual: z.boolean().default(false),
  location: z.string().nullable().optional(),
});

// Available time slots
const timeSlots = [
  "09:00", "09:30", 
  "10:00", "10:30", 
  "11:00", "11:30",
  "13:00", "13:30", 
  "14:00", "14:30", 
  "15:00", "15:30",
  "16:00", "16:30"
];

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function BookAppointmentModal({ 
  isOpen, 
  onClose,
  selectedDoctorId
}: BookAppointmentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default form values
  const defaultValues: Partial<AppointmentFormValues> = {
    isVirtual: false,
    notes: "",
    location: "Memorial Hospital, Room 302",
  };
  
  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });
  
  // Watch for virtual appointment toggle
  const isVirtual = form.watch("isVirtual");
  
  // Mutation for creating an appointment
  const appointmentMutation = useMutation({
    mutationFn: async (appointment: InsertAppointment) => {
      const res = await apiRequest("POST", "/api/appointments", appointment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment booked",
        description: "Your appointment was booked successfully.",
      });
      form.reset(defaultValues);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to book appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: AppointmentFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book an appointment.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const appointmentDate = new Date(values.date);
    const [hours, minutes] = values.time.split(':').map(Number);
    appointmentDate.setHours(hours, minutes);
    
    // Create appointment data
    const appointment: InsertAppointment = {
      date: appointmentDate,
      doctorId: selectedDoctorId as number,
      patientId: user.id,
      reason: values.reason,
      notes: values.notes || null,
      isVirtual: values.isVirtual,
      location: values.isVirtual ? "Virtual Appointment" : values.location || null,
    };
    
    appointmentMutation.mutate(appointment);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Date Picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-gray-500">Select a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => 
                          date < new Date() || // No past dates
                          date > new Date(new Date().setMonth(new Date().getMonth() + 3)) // Max 3 months ahead
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time Picker */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Reason Field */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Annual check-up, Follow-up, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information for the doctor"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Virtual Appointment Toggle */}
            <FormField
              control={form.control}
              name="isVirtual"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Virtual Appointment</FormLabel>
                    <div className="text-sm text-gray-500">
                      Meet with your doctor online
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Location Field (only if not virtual) */}
            {!isVirtual && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Hospital/clinic name and room number" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={appointmentMutation.isPending}
              >
                {appointmentMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}