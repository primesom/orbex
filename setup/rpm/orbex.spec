%global name orbex
%global unmangled_version %{version}
%global __requires_exclude ^.*orbex/addons/mail/static/scripts/orbex-mailgate.py$

Summary: orbex Server
Name: %{name}
Version: %{version}
Release: %{release}
Source0: %{name}-%{unmangled_version}.tar.gz
License: LGPL-3
Group: Development/Libraries
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Prefix: %{_prefix}
BuildArch: noarch
Vendor: orbex S.A. <info@orbexsuite.com>
Requires: sassc
BuildRequires: python3-devel
BuildRequires: pyproject-rpm-macros
Url: https://www.orbexsuite.com

%description
orbex is a complete ERP and CRM. The main features are accounting (analytic
and financial), stock management, sales and purchases management, tasks
automation, marketing campaigns, help desk, POS, etc. Technical features include
a distributed server, an object database, a dynamic GUI,
customizable reports, and XML-RPC interfaces.

%generate_buildrequires
%pyproject_buildrequires

%prep
%autosetup

%build
%py3_build

%install
%py3_install

%post
#!/bin/sh

set -e

orbex_CONFIGURATION_DIR=/etc/orbex
orbex_CONFIGURATION_FILE=$orbex_CONFIGURATION_DIR/orbex.conf
orbex_DATA_DIR=/var/lib/orbex
orbex_GROUP="orbex"
orbex_LOG_DIR=/var/log/orbex
orbex_LOG_FILE=$orbex_LOG_DIR/orbex-server.log
orbex_USER="orbex"

if ! getent passwd | grep -q "^orbex:"; then
    groupadd $orbex_GROUP
    adduser --system --no-create-home $orbex_USER -g $orbex_GROUP
fi
# Register "$orbex_USER" as a postgres user with "Create DB" role attribute
su - postgres -c "createuser -d -R -S $orbex_USER" 2> /dev/null || true
# Configuration file
mkdir -p $orbex_CONFIGURATION_DIR
# can't copy debian config-file as addons_path is not the same
if [ ! -f $orbex_CONFIGURATION_FILE ]
then
    echo "[options]
; This is the password that allows database operations:
; admin_passwd = admin
db_host = False
db_port = False
db_user = $orbex_USER
db_password = False
addons_path = %{python3_sitelib}/orbex/addons
default_productivity_apps = True
" > $orbex_CONFIGURATION_FILE
    chown $orbex_USER:$orbex_GROUP $orbex_CONFIGURATION_FILE
    chmod 0640 $orbex_CONFIGURATION_FILE
fi
# Log
mkdir -p $orbex_LOG_DIR
chown $orbex_USER:$orbex_GROUP $orbex_LOG_DIR
chmod 0750 $orbex_LOG_DIR
# Data dir
mkdir -p $orbex_DATA_DIR
chown $orbex_USER:$orbex_GROUP $orbex_DATA_DIR

INIT_FILE=/lib/systemd/system/orbex.service
touch $INIT_FILE
chmod 0700 $INIT_FILE
cat << EOF > $INIT_FILE
[Unit]
Description=orbex Open Source ERP and CRM
After=network.target

[Service]
Type=simple
User=orbex
Group=orbex
ExecStart=/usr/bin/orbex --config $orbex_CONFIGURATION_FILE --logfile $orbex_LOG_FILE
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

%files
%{_bindir}/orbex
%{python3_sitelib}/%{name}-*.egg-info
%{python3_sitelib}/%{name}
%pycached %exclude %{python3_sitelib}/doc/cla/stats.py
%pycached %exclude %{python3_sitelib}/setup/*.py
%exclude %{python3_sitelib}/setup/orbex

%changelog
* %{build_date} Christophe Monniez <moc@orbexsuite.com> - %{version}-%{release}
- Latest updates
