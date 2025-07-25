
import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageSquare, Users, Settings, Home, Plus, Download, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, getFamilyMembers } from '@/lib/neo4j';
import { User as UserType } from '@/types';
import FamilyTreeVisualization from './FamilyTreeVisualization';

interface DashboardProps {
  user: UserType;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserType>(initialUser);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const members = await getFamilyMembers(user.familyTreeId);
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    };

    if (user.familyTreeId) {
      loadFamilyMembers();
    }
  }, [user.familyTreeId]);

  const activeMembers = familyMembers.filter(m => m.status === 'active');
  const pendingInvites = familyMembers.filter(m => m.status === 'invited');
  const currentDate = new Date().toLocaleDateString();

  const myRelations = familyMembers
    .filter(member => member.relationship && member.userId !== user.userId)
    .slice(0, 5); // Show top 5 relations

  const recentActivities = [
    { id: 1, type: 'member_joined', description: 'John Smith joined the family tree', time: '2 hours ago' },
    { id: 2, type: 'relationship_added', description: 'Added relationship: Father-Son', time: '1 day ago' },
    { id: 3, type: 'profile_updated', description: 'Updated profile information', time: '3 days ago' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined': return <Users className="w-4 h-4" />;
      case 'relationship_added': return <User className="w-4 h-4" />;
      case 'profile_updated': return <Settings className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
          <p className="text-gray-600">Manage your family tree and relationships</p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profilePicture} />
          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Family Tree Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Family Tree Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <FamilyTreeVisualization 
                  user={user} 
                  familyMembers={familyMembers}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  Add New Member
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Export Tree
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Mail className="h-6 w-6 mb-2" />
                  Invite Family Member
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Info Cards */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{familyMembers.length}</div>
              <p className="text-sm text-gray-600">People in your family tree</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeMembers.length}</div>
              <p className="text-sm text-gray-600">Registered and active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingInvites.length}</div>
              <p className="text-sm text-gray-600">Awaiting registration</p>
              {pendingInvites.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingInvites.slice(0, 3).map(invite => (
                    <div key={invite.userId} className="text-xs text-gray-500">
                      {invite.name} ({invite.email})
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Tree Created On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{currentDate}</div>
              <p className="text-sm text-gray-600">Your family tree birth date</p>
            </CardContent>
          </Card>

          {/* My Relations */}
          <Card>
            <CardHeader>
              <CardTitle>My Relations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRelations.length > 0 ? (
                  myRelations.map((relation) => (
                    <div key={relation.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={relation.profilePicture} />
                          <AvatarFallback>{relation.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{relation.name}</div>
                          <div className="text-xs text-gray-500">{relation.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {relation.relationship || 'Family'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No relationships added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
