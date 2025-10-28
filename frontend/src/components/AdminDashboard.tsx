import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Eye, Edit, Trash2, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Exhibition, Exhibitor } from '@/types/exhibition';
import { api } from '@/lib/api';
import { CreateExhibitionDialog } from './CreateExhibitionDialog';
import { CreateExhibitorDialog } from './CreateExhibitorDialog';

export const AdminDashboard = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [exhibitors, setExhibitors] = useState<{ [key: string]: Exhibitor[] }>({});
  const [selectedExhibition, setSelectedExhibition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateExpo, setShowCreateExpo] = useState(false);
  const [showCreateExhibitor, setShowCreateExhibitor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExhibitions();
  }, []);

  const loadExhibitions = async () => {
    try {
      setLoading(true);
      const data = await api.exhibitions.getAll();
      setExhibitions(data);
      
      // Load exhibitors for each exhibition
      const exhibitorData: { [key: string]: Exhibitor[] } = {};
      for (const expo of data) {
        exhibitorData[expo.id] = await api.exhibitors.getByExhibition(expo.id);
      }
      setExhibitors(exhibitorData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exhibitions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExhibition = async (data: Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.exhibitions.create(data);
      setShowCreateExpo(false);
      loadExhibitions();
      toast({
        title: "Success",
        description: "Exhibition created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exhibition",
        variant: "destructive"
      });
    }
  };

  const handleCreateExhibitor = async (data: Omit<Exhibitor, 'id' | 'secureToken' | 'scannerUrl' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.exhibitors.create(data);
      setShowCreateExhibitor(false);
      loadExhibitions();
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
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

  const getStatusColor = (status: Exhibition['status']) => {
    switch (status) {
      case 'active':
        return 'bg-accent text-accent-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading exhibitions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Exhibition Admin</h1>
              <p className="text-white/80 text-lg">Manage exhibitions and exhibitor scanner access</p>
            </div>
            <Button
              variant="hero"
              size="lg"
              onClick={() => setShowCreateExpo(true)}
              className="bg-white/20 hover:bg-white/30 border border-white/30"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Exhibition
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Exhibition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {exhibitions.map((exhibition) => (
            <Card key={exhibition.id} className="shadow-card hover:shadow-elegant transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{exhibition.name}</CardTitle>
                    <Badge className={getStatusColor(exhibition.status)}>
                      {exhibition.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-2">{exhibition.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(exhibition.startDate).toLocaleDateString()} - {new Date(exhibition.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {exhibition.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {exhibitors[exhibition.id]?.length || 0} exhibitors
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExhibition(selectedExhibition === exhibition.id ? null : exhibition.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedExhibition === exhibition.id ? 'Hide' : 'View'} Exhibitors
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExhibition(exhibition.id);
                      setShowCreateExhibitor(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exhibitor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exhibitor Details */}
        {selectedExhibition && exhibitors[selectedExhibition] && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>
                Exhibitors - {exhibitions.find(e => e.id === selectedExhibition)?.name}
              </CardTitle>
              <CardDescription>
                Manage exhibitor access and scanner URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {exhibitors[selectedExhibition].map((exhibitor) => (
                  <div key={exhibitor.id} className="border rounded-lg p-4 bg-gradient-card">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{exhibitor.name}</h4>
                        <p className="text-sm text-muted-foreground">{exhibitor.company}</p>
                        <p className="text-sm text-muted-foreground">{exhibitor.email}</p>
                        {exhibitor.phoneNumber && (
                          <p className="text-sm text-muted-foreground">{exhibitor.phoneNumber}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={exhibitor.isActive ? "default" : "secondary"}>
                          {exhibitor.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-muted/50 rounded border-2 border-dashed border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Scanner URL</p>
                          <p className="text-sm font-mono break-all">{exhibitor.scannerUrl}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(exhibitor.scannerUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {exhibitors[selectedExhibition].length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exhibitors added yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowCreateExhibitor(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Exhibitor
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {exhibitions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">No exhibitions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first exhibition to start managing exhibitors and QR code scanning.
            </p>
            <Button variant="hero" size="lg" onClick={() => setShowCreateExpo(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create First Exhibition
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateExhibitionDialog
        open={showCreateExpo}
        onOpenChange={setShowCreateExpo}
        onSubmit={handleCreateExhibition}
      />
      
      {selectedExhibition && (
        <CreateExhibitorDialog
          open={showCreateExhibitor}
          onOpenChange={setShowCreateExhibitor}
          onSubmit={handleCreateExhibitor}
          exhibitionId={selectedExhibition}
        />
      )}
    </div>
  );
};