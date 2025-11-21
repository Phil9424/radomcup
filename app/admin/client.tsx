"use client";

import { useState, useEffect } from "react";
import { TournamentList } from "@/components/admin/tournament-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, UsersIcon, Plus, Trash2, UserCheck, Crown, Edit, RefreshCw } from 'lucide-react';
import { logout } from "@/app/actions/auth-actions";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

interface AdminPageClientProps {
  tournaments: Tournament[];
  adminUser: AdminUser;
  currentUserEmail?: string;
}

function AdminManager({ currentUserEmail }: { currentUserEmail?: string }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin'
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin-users');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        // Если API не работает, показываем тестовые данные
        console.log('API not available, showing test data');
        setAdmins([
          {
            id: '1',
            email: 'john_doe_94@bk.ru',
            full_name: 'John Doe',
            role: 'super_admin',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      // Fallback для тестирования
      setAdmins([
        {
          id: '1',
          email: 'john_doe_94@bk.ru',
          full_name: 'John Doe',
          role: 'super_admin',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.password || newAdmin.password.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const response = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });

      if (response.ok) {
        await fetchAdmins();
        setShowAddDialog(false);
        setNewAdmin({ email: '', full_name: '', password: '', role: 'admin' });
        alert('Администратор успешно добавлен');
      } else {
        const errorData = await response.json();
        alert(`Ошибка при добавлении администратора: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Ошибка при добавлении администратора');
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;

    try {
      const response = await fetch(`/api/admin-users/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });

      if (response.ok) {
        await fetchAdmins();
        setShowAddDialog(false);
        setEditingAdmin(null);
        setNewAdmin({ email: '', full_name: '', password: '', role: 'admin' });
      } else {
        alert('Ошибка при обновлении администратора');
      }
    } catch (error) {
      console.error('Error editing admin:', error);
      alert('Ошибка при обновлении администратора');
    }
  };

  const startEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setNewAdmin({
      email: admin.email,
      full_name: admin.full_name,
      password: '',
      role: admin.role
    });
    setShowAddDialog(true);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return;

    try {
      const response = await fetch(`/api/admin-users/${adminId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAdmins();
      } else {
        alert('Ошибка при удалении администратора');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Ошибка при удалении администратора');
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'super_admin' ? <Crown className="h-4 w-4 text-yellow-500" /> : <UserCheck className="h-4 w-4 text-blue-500" />;
  };

  const getRoleBadge = (role: string) => {
    return role === 'super_admin' ? (
      <Badge variant="default" className="bg-yellow-500 text-black">
        <Crown className="mr-1 h-3 w-3" />
        Супер-админ
      </Badge>
    ) : (
      <Badge variant="secondary">
        <UserCheck className="mr-1 h-3 w-3" />
        Админ
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Список администраторов</h3>
              <p className="text-sm text-muted-foreground">
                Управление правами доступа к админ-панели
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) {
                setEditingAdmin(null);
                setNewAdmin({ email: '', full_name: '', password: '', role: 'admin' });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить админа
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Редактировать администратора' : 'Добавить администратора'}
              </DialogTitle>
              <DialogDescription>
                {editingAdmin
                  ? 'Измените данные администратора системы'
                  : 'Создайте нового администратора системы'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Имя
                </Label>
                <Input
                  id="full_name"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({...newAdmin, full_name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              {!editingAdmin && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="col-span-3"
                    placeholder="Минимум 6 символов"
                    required={!editingAdmin}
                    minLength={6}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Роль
                </Label>
                <Select value={newAdmin.role} onValueChange={(value: 'admin' | 'super_admin') => setNewAdmin({...newAdmin, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Админ</SelectItem>
                    <SelectItem value="super_admin">Супер-админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
                <DialogFooter>
                  <Button onClick={editingAdmin ? handleEditAdmin : handleAddAdmin}>
                    {editingAdmin ? 'Обновить' : 'Добавить'}
                  </Button>
                </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Загрузка администраторов...
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <UsersIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Администраторов пока нет</p>
              <p className="text-sm">Добавьте первого администратора</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-20">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(admin.role)}
                        <span className="font-medium">{admin.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditAdmin(admin)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {admin.email !== currentUserEmail ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm ml-2">Это вы</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPageClient({ tournaments, adminUser, currentUserEmail }: AdminPageClientProps) {
  const [activeTab, setActiveTab] = useState("tournaments");

  console.log('[CLIENT] AdminPageClient rendered, adminUser:', adminUser, 'currentUserEmail:', currentUserEmail);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Панель администратора</h1>
          <p className="text-muted-foreground">
            Управление турнирами, игровыми днями и парсинг данных матчей
          </p>
          {adminUser && (
            <p className="text-sm text-muted-foreground mt-1">
              Добро пожаловать, {adminUser.full_name} ({adminUser.role === 'super_admin' ? 'Супер-админ' : 'Администратор'})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (confirm('Пересоздать все данные матчей? Это может занять время.')) {
                try {
                  const response = await fetch('/api/reparse-matches', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  if (response.ok) {
                    const result = await response.json();
                    alert(`Данные пересозданы! Обработано ${result.message}`);
                    window.location.reload();
                  } else {
                    alert('Ошибка при пересоздании данных');
                  }
                } catch (error) {
                  alert('Ошибка при пересоздании данных');
                }
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Пересоздать данные
          </Button>
          <form action={logout}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </form>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tournaments">Турниры</TabsTrigger>
          {adminUser?.role === 'super_admin' && (
            <TabsTrigger value="admins" className="bg-red-500 text-white">
              Администраторы ⭐
            </TabsTrigger>
          )}
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <TournamentList tournaments={tournaments} />
        </TabsContent>

        {adminUser?.role === 'super_admin' && (
          <TabsContent value="admins">
            <div className="bg-red-100 border-red-300 border-4 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-red-800 mb-1">Управление администраторами ⭐</h3>
                  <p className="text-lg text-red-600">
                    Просмотр и управление администраторами системы
                  </p>
                  <p className="text-sm text-red-500 mt-2">
                    Роль: {adminUser.role} | Видно вкладку: ✅ | Активная вкладка: {activeTab}
                  </p>
                </div>
                <AdminManager currentUserEmail={currentUserEmail} />
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="settings">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-2">Настройки администратора</h3>
            <p className="text-muted-foreground">
              Дополнительные настройки и параметры конфигурации появятся здесь
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
