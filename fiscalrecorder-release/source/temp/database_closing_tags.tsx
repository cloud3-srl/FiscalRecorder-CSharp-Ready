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
