jest.mock('../utilities/send-email');
jest.mock('../utilities/add-tasks-to-todoist');
const config = require('../utilities/test-config');
const admin = require('../utilities/test-admin');
const addFilms = require('../utilities/test-add-films')(admin, config);
const addUsers = require('../utilities/test-add-users')(admin, config);
const removeFilms = require('../utilities/test-remove-films')(admin, config);
const removeUsers = require('../utilities/test-remove-users')(admin, config);
const dateFormat = require('../utilities/date-formatter');

const notify = require('../scripts/notify')(admin, config);

const sendEmail = require('../utilities/send-email')({});
const addTasksToTodoist = require('../utilities/add-tasks-to-todoist');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate()+1);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate()-1);
const filmYesterdayUsers = {imdb:'0127',title:"on yesterday 3",channel:"bbc7",year:2012,time: dateFormat(yesterday),users:{x1:true}}; 
const filmTomorrowNoUsers = {imdb:'0126',title:"on tomorrow 2",channel:"bbc8",year:2013,time: dateFormat(tomorrow)};
const filmTomorrowUsers = {imdb:'0128',title:"on tomorrow 3",channel:"bbc8",year:2013,time: dateFormat(tomorrow),users:{x1:true}};
const filmTomorrowUserNoToken = {imdb:'0129',title:"on tomorrow 3",channel:"bbc8",year:2013,time: dateFormat(tomorrow),users:{x3:true}};
const filmTomorrowUserNoTokenChannelBBC = {imdb:'0130',title:"on tomorrow 3",channel:"BBC London",year:2013,time: dateFormat(tomorrow),users:{x3:true}};
const filmTomorrowUserNoTokenChannelValid = {imdb:'0131',title:"on tomorrow 3",channel:"4Music",year:2013,time: dateFormat(tomorrow),users:{x3:true}};
const filmTomorrowUserNoTokenChannelInvalid = {imdb:'0132',title:"on tomorrow 3",channel:"Sky Cinema",year:2013,time: dateFormat(tomorrow),users:{x3:true}};

const setup = () => addUsers([
  {id:'x1',email:'test1@email.com',todoistToken:'t1'},
  {id:'x2',email:'test2@email.com',todoistToken:'t2'},
  {id:'x3',email:'test3@email.com'},
]);

const teardown = () => removeUsers();

describe('Email sent for film', () => {

  beforeAll(() => setup());

  beforeEach(() => {
    jest.clearAllMocks();
    return removeFilms();
  });

  afterAll(() => teardown()); 

  it('should have the isDev flag', () => {
    expect(config.isDev).toEqual(true);
  });

  it('should call addTasksToTodoist', async () => {
    await addFilms([filmTomorrowNoUsers, filmTomorrowUsers]);
    await notify.getFilmsToSend();
    expect(addTasksToTodoist).toHaveBeenCalledWith({
      token: 't1',
      films: [
        {title:filmTomorrowUsers.title,channel:filmTomorrowUsers.channel, time: filmTomorrowUsers.time}
      ]
    });
  });

  it('should not call addTasksToTodoist if no users', async () => {
    await addFilms([filmTomorrowNoUsers, filmYesterdayUsers]);
    await notify.getFilmsToSend();
    expect(addTasksToTodoist).not.toHaveBeenCalled;
  });

  it('should call sendEmail', async () => {
    await addFilms([filmTomorrowNoUsers, filmTomorrowUsers]);
    await notify.getFilmsToSend();
    expect(sendEmail).toHaveBeenCalledWith({
      "from": "Film Alert <film@mg.rw251.com>", 
      "html": "<p><ul><li>on tomorrow 3 is on bbc8 at " + dateFormat(tomorrow) +"</li></ul></p>", 
      "subject": "Upcoming films", 
      "text": "on tomorrow 3 - bbc8 - " + dateFormat(tomorrow), 
      "to": "test1@email.com"
    });
  });

  it('should not call sendEmail if no users', async () => {
    await addFilms([filmTomorrowNoUsers, filmYesterdayUsers]);
    await notify.getFilmsToSend();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should not call addTaskToTodoist', async () => {
    await addFilms([filmTomorrowUserNoToken]);
    await notify.getFilmsToSend();
    expect(addTasksToTodoist).not.toHaveBeenCalled();
  });

  it('should only list films on freeview channels', async () => {
    await addFilms([
      filmTomorrowUserNoTokenChannelBBC,
      filmTomorrowUserNoTokenChannelInvalid,
      filmTomorrowUserNoTokenChannelValid
    ]);
    await notify.getFilmsToSend();
    expect(addTasksToTodoist).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith({
      "from": "Film Alert <film@mg.rw251.com>", 
      "html": "<p><ul><li>on tomorrow 3 is on BBC London at " + dateFormat(tomorrow) +"</li><li>on tomorrow 3 is on 4Music at " + dateFormat(tomorrow) +"</li></ul></p>", 
      "subject": "Upcoming films", 
      "text": "on tomorrow 3 - BBC London - " + dateFormat(tomorrow)+", on tomorrow 3 - 4Music - " + dateFormat(tomorrow), 
      "to": "test3@email.com"
    });
  });
});