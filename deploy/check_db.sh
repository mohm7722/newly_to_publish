#!/bin/bash
sudo -u postgres psql -d medusa-store -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
sudo -u postgres psql -d medusa-store -c "\dt" | head -40
