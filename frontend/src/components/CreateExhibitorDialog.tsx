import { useState } from 'react';
import { Users, Building, Mail, Phone, Calendar, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Exhibitor } from '@/types/exhibition';
import { exhibitorAPI } from '@/lib/api';
import { useToast, toast } from '@/hooks/use-toast';

interface CreateExhibitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onSubmit: (data: Omit<Exhibitor, 'id' | 'secureToken' | 'scannerUrl' | 'createdAt' | 'updatedAt'>) => void;
  onSuccess?: (newExhibitor: Exhibitor) => void;
  // exhibitionId: string;
}

export const CreateExhibitorDialog = ({ open, onOpenChange, onSuccess }: CreateExhibitorDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    exhibitionName:'',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    isActive: true,
    domainName: window.location.origin
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.company || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Company, Email).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // await onSubmit({
      //   ...formData,
      //   exhibitionId
      // });

      const newExhibitor = await exhibitorAPI.create(formData);
      toast({
        title: "Success",
        description: `Exhibitor ${newExhibitor.name} created successfully.`,
      });
      setFormData({
        name: '',
        company: '',
        email: '',
        exhibitionName: '',
        phoneNumber: '',
        startDate: '',
        endDate: '',
        isActive: true,
        domainName: window.location.origin
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newExhibitor);
      }
    } catch (error) {
      console.error("Failed to create exhibitor:", error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating the exhibitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Add New Exhibitor
          </DialogTitle>
          <DialogDescription>
            Create a new exhibitor account and generate their unique scanner URL.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="e.g., John Smith"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company"
                placeholder="e.g., Acme Corp"
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="e.g., john@acme.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exhibitionName">Exhibition Name *</Label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="exhibitionName"
                placeholder="e.g., Tech-Expo 2025"
                value={formData.exhibitionName}
                onChange={(e) => updateField('exhibitionName', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                placeholder="e.g., +1-555-0123"
                value={formData.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  placeholder="e.g., 01-01-2025"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  placeholder="e.g., 01-01-2025"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
            <Label htmlFor="isActive">Active (can scan QR codes)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Exhibitor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};