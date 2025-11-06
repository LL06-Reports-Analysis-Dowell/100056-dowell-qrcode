import { useState, useEffect } from 'react';
import { Plus, Search, Copy, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Exhibition, Exhibitor } from '@/types/exhibition';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { CreateExhibitorDialog } from '@/components/CreateExhibitorDialog';

interface ExhibitorWithExhibition extends Exhibitor {
  exhibitionName: string;
  startDate: string;
  endDate: string;
}

export const AdminDashboard = () => {
  const [exhibitors, setExhibitors] = useState<ExhibitorWithExhibition[]>([]);
  const [filteredExhibitors, setFilteredExhibitors] = useState<ExhibitorWithExhibition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExhibitors();
  }, []);

  useEffect(() => {
    filterExhibitors();
  }, [searchQuery, startDateFilter, endDateFilter, exhibitors]);

  const loadExhibitors = async () => {
    try {
      setLoading(true);
      const exhibitions = await api.exhibitions.getAll();
      
      // Load all exhibitors with their exhibition info
      const allExhibitors: ExhibitorWithExhibition[] = [];
      for (const expo of exhibitions) {
        const expoExhibitors = await api.exhibitors.getByExhibition(expo.id);
        const exhibitorsWithExpo = expoExhibitors.map(exhibitor => ({
          ...exhibitor,
          exhibitionName: expo.name,
          startDate: expo.startDate,
          endDate: expo.endDate
        }));
        allExhibitors.push(...exhibitorsWithExpo);
      }
      
      setExhibitors(allExhibitors);
      setFilteredExhibitors(allExhibitors);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exhibitors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExhibitors = () => {
    let filtered = [...exhibitors];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exhibitor => 
        exhibitor.name.toLowerCase().includes(query) ||
        exhibitor.company.toLowerCase().includes(query) ||
        exhibitor.email.toLowerCase().includes(query) ||
        exhibitor.exhibitionName.toLowerCase().includes(query) ||
        (exhibitor.phoneNumber?.toLowerCase() || '').includes(query) ||
        (exhibitor.isActive ? 'active' : 'inactive').includes(query)
      );
    }

    // Start date filter
    if (startDateFilter) {
      filtered = filtered.filter(exhibitor => 
        new Date(exhibitor.startDate) >= new Date(startDateFilter)
      );
    }

    // End date filter
    if (endDateFilter) {
      filtered = filtered.filter(exhibitor => 
        new Date(exhibitor.endDate) <= new Date(endDateFilter)
      );
    }
    
    setFilteredExhibitors(filtered);
  };

  const handleCreateExhibitor = async (data: Omit<Exhibitor, 'id' | 'secureToken' | 'scannerUrl' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.exhibitors.create(data);
      await loadExhibitors();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Exhibitor created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exhibitor",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (exhibitorId: string, currentStatus: boolean) => {
    try {
      await api.exhibitors.update(exhibitorId, { isActive: !currentStatus });
      loadExhibitors();
      toast({
        title: "Status Updated",
        description: `Exhibitor is now ${!currentStatus ? 'active' : 'inactive'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copied!",
        description: "Scanner URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading exhibitors...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Exhibitor Management</h1>
              <p className="text-muted-foreground">Manage exhibitor access and scanner URLs</p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Exhibitor
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search/Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by name, company, email, exhibition, phone, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-6 text-base"
            />
          </div>
          
          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Start Date From"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="End Date Until"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>
          </div>
        </div>

        {/* Exhibitor Cards Grid */}
        {filteredExhibitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExhibitors.map((exhibitor) => (
              <Card key={exhibitor.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{exhibitor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{exhibitor.company}</p>
                    </div>
                    <Badge 
                      variant={exhibitor.isActive ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {exhibitor.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Email */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                    <p className="text-sm break-all">{exhibitor.email}</p>
                  </div>

                  {/* Exhibition Name */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Exhibition Name</p>
                    <p className="text-sm">{exhibitor.exhibitionName}</p>
                  </div>

                  {/* Phone Number */}
                  {exhibitor.phoneNumber && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-sm">{exhibitor.phoneNumber}</p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm">{format(new Date(exhibitor.startDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">End Date</p>
                      <p className="text-sm">{format(new Date(exhibitor.endDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {/* Scanner URL */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Scanner URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded border truncate">
                        {truncateUrl(exhibitor.scannerUrl)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(exhibitor.scannerUrl)}
                        className="shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <label htmlFor={`status-${exhibitor.id}`} className="text-sm font-medium cursor-pointer">
                      Active Status
                    </label>
                    <Switch
                      id={`status-${exhibitor.id}`}
                      checked={exhibitor.isActive}
                      onCheckedChange={() => handleToggleStatus(exhibitor.id, exhibitor.isActive)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No exhibitors found' : 'No exhibitors yet'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search query to find what you\'re looking for.'
                : 'Add your first exhibitor to get started with QR code scanning.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Exhibitor Dialog */}
      <CreateExhibitorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateExhibitor}
        exhibitionId="expo-1"
      />
    </div>
  );
};