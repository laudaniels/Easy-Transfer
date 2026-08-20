<template lang="pug">
  .download-app
    a.btn.btn-sm.btn-info.btn-admin-refresh(@click='login()', title='Refresh', v-if="loggedIn")
      icon(name="sync-alt")

    .alert.alert-danger(v-show="error")
      strong
        icon.fa-fw(name="exclamation-triangle")
        |  {{ error }}
    form.well(v-if='!loggedIn', @submit.stop.prevent="login")
      h3 Password
      .form-group
        input.form-control(type='password', v-model='password', autofocus="")
      p.text-danger(v-show='passwordWrong')
        strong Access denied!
      |
      button.btn.btn-primary(type="submit", :disabled="!password")
        icon.fa-fw(name="sign-in-alt")
        |  login

    div(v-if="loggedIn")
      .form-group.admin-filter
        input.form-control(type='text', v-model='filterText', placeholder='Filter by bucket ID…')
        span.help-block {{ filteredSids.length }} / {{ Object.keys(db).length }} buckets
      table.table.table-hover
        thead
          tr
            th.sortable(@click="setSort('sid')") SID {{ sortArrow('sid') }}
            th.sortable(@click="setSort('created')") Created {{ sortArrow('created') }}
            th.sortable(@click="setSort('downloaded')") Downloaded {{ sortArrow('downloaded') }}
            th.sortable(@click="setSort('expire')") Expire {{ sortArrow('expire') }}
            th.sortable(@click="setSort('size')") Size {{ sortArrow('size') }}
        template(v-for="sid in filteredSids")
          tbody(:class="{expanded: expand===sid}")
            tr.bucket(@click="expandView(sid)")
              td
                | {{ sid }}
                icon.pull-right(name="key", v-if="sum[sid].password", title="Password protected")
              td {{ sum[sid].created | date }}
              td
                template(v-if="sum[sid].lastDownload") {{ sum[sid].lastDownload | date}}
                template(v-else="") -
              td
                template(v-if="typeof sum[sid].firstExpire === 'number'") {{ sum[sid].firstExpire | date }}
                template(v-else)  {{ sum[sid].firstExpire }}
              td.text-right {{ humanFileSize(sum[sid].size) }}
          tbody.expanded(v-if="expand === sid")
            template(v-for="file in db[sid]")
              tr.file
                td {{ file.metadata.name }}
                td {{+file.metadata.createdAt | date}}
                td
                  template(v-if="file.metadata.lastDownload") {{ +file.metadata.lastDownload | date}}
                  template(v-else="") -
                td
                  template(v-if="typeof file.expireDate === 'number'") {{ file.expireDate | date }}
                  template(v-else) {{ file.expireDate }}
                td.text-right {{ humanFileSize(file.size) }}
        tfoot
          tr
            td(colspan="3")
            td.text-right(colspan="2") Sum: {{ humanFileSize(filteredSizeSum) }}

</template>


<script>
  import 'vue-awesome/icons/exclamation-triangle';
  import 'vue-awesome/icons/sync-alt';
  import 'vue-awesome/icons/sign-in-alt';
  import 'vue-awesome/icons/key';


  export default {
    name: 'app',

    data () {
      return {
        db: {},
        sum: {},
        loggedIn: false,
        password: '',
        error: '',
        passwordWrong: false,
        expand: false,
        sizeSum: 0,
        filterText: '',
        sortKey: 'created',
        sortDir: 'desc'
      }
    },

    computed: {
      filteredSids() {
        const q = this.filterText.trim().toLowerCase();
        const sids = q
          ? Object.keys(this.db).filter(sid => sid.toLowerCase().includes(q))
          : Object.keys(this.db);
        const dir = this.sortDir === 'asc' ? 1 : -1;
        return sids.slice().sort((a, b) => {
          const va = this.sortValue(a);
          const vb = this.sortValue(b);
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
          return 0;
        });
      },

      filteredSizeSum() {
        return this.filteredSids.reduce((total, sid) => total + (this.sum[sid] ? this.sum[sid].size : 0), 0);
      }
    },

    methods: {
      expandView(sid) {
        if(this.expand === sid) return this.expand = false;
        this.expand = sid;
      },

      setSort(key) {
        if (this.sortKey === key) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortDir = key === 'sid' ? 'asc' : 'desc';
        }
      },

      sortArrow(key) {
        if (this.sortKey !== key) return '';
        return this.sortDir === 'asc' ? '▲' : '▼';
      },

      sortValue(sid) {
        if (this.sortKey === 'sid') return sid;
        const s = this.sum[sid];
        if (!s) return 0;
        if (this.sortKey === 'expire') return typeof s.firstExpire === 'number' ? s.firstExpire : -1;
        if (this.sortKey === 'downloaded') return s.lastDownload;
        if (this.sortKey === 'size') return s.size;
        return s.created;
      },

      login() {
        if(!this.password) return;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'admin/data.json');
        xhr.setRequestHeader("x-passwd", this.password);
        xhr.onload = () => {
          if(xhr.status === 200) {
            try {
              this.db = JSON.parse(xhr.responseText);
              this.loggedIn = true;
              this.error = '';
              this.passwordWrong = false;
              this.expandDb();
            }
            catch(e) {
              this.error = e.toString();
            }
          } else {
            if(xhr.status === 403) this.passwordWrong = true;
            else this.error = `${xhr.status} ${xhr.statusText}: ${xhr.responseText}`;
          }
        };
        xhr.send();
      },

      expandDb() {
        this.sizeSum = 0;
        Object.keys(this.db).forEach(sid => {
          const bucketSum = {
            firstExpire: Number.MAX_SAFE_INTEGER,
            lastDownload: 0,
            created: Number.MAX_SAFE_INTEGER,
            password: false,
            size: 0
          };
          this.db[sid].forEach(file => {
            bucketSum.size += file.size;
            if(file.metadata._password) {
              bucketSum.password = true;
            }
            if(+file.metadata.createdAt < bucketSum.created) {
              bucketSum.created = +file.metadata.createdAt;
            }
            if(file.metadata.lastDownload && +file.metadata.lastDownload > bucketSum.lastDownload) {
              bucketSum.lastDownload = +file.metadata.lastDownload;
            }
            if(file.metadata.retention === 'one-time') {
              bucketSum.firstExpire = 'one-time';
              file.expireDate = file.metadata.retention;
            }
            else {
              file.expireDate = +file.metadata.createdAt + (+file.metadata.retention * 1000);
              if(bucketSum.firstExpire > file.expireDate) bucketSum.firstExpire = file.expireDate;
            }
          });
          this.sizeSum += bucketSum.size;
          this.$set(this.sum, sid, bucketSum);
        });
      },

      humanFileSize(fileSizeInBytes) {
        let i = -1;
        const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        do {
          fileSizeInBytes = fileSizeInBytes / 1024;
          i++;
        } while(fileSizeInBytes > 1024);
        return Math.max(fileSizeInBytes, 0.00).toFixed(2) + byteUnits[i];
      },

    },


  }
</script>

<style>
  .bucket {
    cursor: pointer;
  }
  .expanded {
    background: #fafafa;
  }
  .expanded .bucket td {
    font-weight: bold;
  }
  tfoot {
    font-weight: bold;
  }
</style>
