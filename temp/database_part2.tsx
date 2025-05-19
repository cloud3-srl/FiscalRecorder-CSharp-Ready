return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Gestione Database</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="config">Configurazione</TabsTrigger>
            <TabsTrigger value="query">Query SQL</TabsTrigger>
            <TabsTrigger value="logs">Log Connessione</TabsTrigger>
            <TabsTrigger value="schedule">Operazioni Pianificate</TabsTrigger>
          </TabsList>

          {/* Tab Configurazione */}
          <TabsContent value="config">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Nuova Configurazione</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => saveConfig(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome configurazione</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="es. Database principale" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="driver"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="server"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="es. localhost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="database"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Database</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="es. AHR_POG" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={testingConnection}
                      >
                        {testingConnection ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Testa connessione
                      </Button>

                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Salva configurazione
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>

              {(configs as any[]).length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Configurazioni salvate</h2>
                  <div className="space-y-4">
                    {(configs as any[]).map((config: any) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 border rounded"
                      >
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {config.server} / {config.database}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab Query SQL */}
          <TabsContent value="query">
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Esegui Query SQL</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Query SQL</label>
                    <Textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="Inserisci la tua query SQL qui..."
                      className="font-mono h-32"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleExecuteQuery}
                      disabled={isExecutingQuery}
                    >
                      {isExecutingQuery ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Esegui Query
                    </Button>
                  </div>
                </div>
              </Card>

              {queryResult && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Risultato Query</h2>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {queryResult.columns.map((column: string) => (
                            <TableHead key={column}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResult.rows.map((row: any, index: number) => (
                          <TableRow key={index}>
                            {queryResult.columns.map((column: string) => (
                              <TableCell key={column}>{row[column]}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {queryResult.rowCount} righe restituite
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Cronologia Query</h2>
                {isLoadingHistory ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Query</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Durata</TableHead>
                          <TableHead>Righe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(queryHistory as any[]).length > 0 ? (
                          (queryHistory as any[]).map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-xs max-w-xs truncate">
                                {item.query}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  item.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.status}
                                </span>
                              </TableCell>
                              <TableCell>{item.duration ? `${item.duration}ms` : '-'}</TableCell>
                              <TableCell>{item.rowsAffected || 0}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nessuna query eseguita
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Tab Log Connessione */}
          <TabsContent value="logs">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Log di Connessione</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/connection-logs'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aggiorna
                </Button>
              </div>
              
              {isLoadingLogs ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Configurazione</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Messaggio</TableHead>
                        <TableHead>Durata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(connectionLogs as any[]).length > 0 ? (
                        (connectionLogs as any[]).map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>ID: {log.configId}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </TableCell>
                            <TableCell>{log.message}</TableCell>
                            <TableCell>{log.duration ? `${log.duration}ms` : '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            Nessun log di connessione
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab Operazioni Pianificate */}
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Operazioni Pianificate</h2>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Operazione
                  </Button>
                </div>
                
                {isLoadingScheduled ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Pianificazione</TableHead>
                          <TableHead>Prossima Esecuzione</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(scheduledOperations as any[]).length > 0 ? (
                          (scheduledOperations as any[]).map((operation: any) => (
                            <TableRow key={operation.id}>
                              <TableCell>{operation.name}</TableCell>
                              <TableCell>
                                <span className="capitalize">{operation.type}</span>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted p-1 rounded">{operation.schedule}</code>
                              </TableCell>
                              <TableCell>
                                {operation.nextRun ? new Date(operation.nextRun).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  operation.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  operation.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {operation.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteOperation(operation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              Nessuna operazione pianificata
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Informazioni sulla Pianificazione</h2>
                <div className="space-y-4">
                  <p>
                    Le operazioni pianificate utilizzano la sintassi cron per definire quando devono essere eseguite.
                    Ecco alcuni esempi:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <code className="text-sm">0 0 * * *</code>
                      <p className="text-sm mt-1">Ogni giorno a mezzanotte</p>
                    </div>
                    <div className="border rounded p-3">
                      <code className="text-sm">0 */6 * * *</code>
                      <p className="text-sm mt-1">Ogni 6 ore</p>
                    </div>
                    <div className="border rounded p-3">
                      <code className="text-sm">0 8 * * 1-5</code>
                      <p className="text-sm mt-1">Ogni giorno feriale alle 8:00</p>
                    </div>
                    <div className="border rounded p-3">
                      <code className="text-sm">0 0 1 * *</code>
                      <p className="text-sm mt-1">Il primo giorno di ogni mese</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog per la pianificazione di operazioni */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pianifica Nuova Operazione</DialogTitle>
            <DialogDescription>
              Crea una nuova operazione pianificata per importare o esportare dati.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome operazione</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="es. Import prodotti giornaliero" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scheduleForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo operazione</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="export">Export</SelectItem>
                        <SelectItem value="sync">Sincronizzazione</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scheduleForm.control}
                name="configId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configurazione database</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona configurazione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(configs as any[]).map((config: any) => (
                          <SelectItem key={config.id} value={config.id.toString()}>
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scheduleForm.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pianificazione (formato cron)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="es. 0 0 * * *" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isScheduling}>
                  {isScheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Pianifica
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
